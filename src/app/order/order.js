angular.module('orderCloud')
    .service( 'OrderShareService', OrderShareService)
    .config(orderConfig)
    .controller('OrderCtrl', OrderController)
    .controller('FinalOrderInfoCtrl',FinalOrderInfoController);

function OrderShareService() {
    var svc = {
        LineItems: [],
        Payments: [],
        Quote: null,
        Me: null
    };
    return svc;
}


function orderConfig($stateProvider) {
    $stateProvider
	    .state('order', {
	        parent: 'base',
	        templateUrl: 'order/templates/order.tpl.html',
	        controller: 'OrderCtrl',
	        controllerAs: 'order',
	        url: '/order',
	        data: {componentName: 'order'},
	        resolve: {
	        	Me: function(OrderCloudSDK) {
	        	    return OrderCloudSDK.Me.Get();
		        },
	            Order: function(CurrentOrder, $q, $exceptionHandler){
                    var dfd = $q.defer();
                    CurrentOrder.Get().then(function(data){
	        			 dfd.resolve(data);
					})
					.catch(function (ex) {
						toastr.error('Your order could not be retrieved.', 'Error');
                        $exceptionHandler(ex);
						dfd.resolve({});
					});
	        		return dfd.promise;
	            },
	            Buyer: function (OrderCloudSDK, Order) {
	                return OrderCloudSDK.Buyers.Get(Order.FromCompanyID);
	            },
	            DeliveryAddress: function (OrderCloudSDK, Order) {
	                if(Order.ShippingAddressID) {
	                    return OrderCloudSDK.Addresses.Get(Order.xp.BuyerID, Order.ShippingAddressID);
	                } else {
	                    return null;
	                }
	            },
	            LineItems: function ($q, $state, $cookieStore, toastr, OrderCloudSDK, CurrentOrder, OrderShareService, Order, LineItemHelpers, Buyer) {
	                OrderShareService.LineItems.length = 0;
                    var direction = "Incoming";
                    var dfd = $q.defer();
					var lang;
					if(Buyer.ID.substring(0,5) === 'WPIFR' && Buyer.xp.Lang) {
						lang = Buyer.xp.Lang.id;
					}

		            OrderCloudSDK.LineItems.List(direction, Order.ID, { 'filters': {'Order.xp.BuyerID' : Order.xp.BuyerID}})
			            .then(function(data) {
				            if (!data.Items.length) {
					            toastr.error('Your quote does not contain any line items.', 'Error');
					            dfd.resolve({ Items: [] });
				            } else {
					            LineItemHelpers.GetBlankProductInfo(data.Items);
					            LineItemHelpers.GetProductInfo(data.Items, Order)
						            .then(function () {
						                if (lang && data.Items) {
						                    for (var i = 0; i < data.Items.length; i++) {
						                        var tmp = data.Items[i];
						                        //if (!tmp.xp.Description && tmp.Product && tmp.Product.xp && tmp.Product.xp[lang]) {
                                                if (tmp.Product && tmp.Product.xp && tmp.Product.xp[lang]) {
						                            tmp.xp.Description = tmp.Product.xp[lang].Description || tmp.xp.Description; //We have to use the xp property instead of the product to accomodate versioning.
						                        }
						                    }
						                }
						                dfd.resolve(data);
						            });
				            }
			            })
			            .catch(function () {
			                toastr.error('Your quote does not contain any line items.', 'Error');
			                dfd.resolve({ Items: [] });
		                });
		            return dfd.promise;
	            },
		        PreviousLineItems: function($q, $cookieStore, toastr, OrderCloudSDK, Order, LineItemHelpers, Buyer) {
			        var pieces = Order.ID.split('-Rev');
			        if(pieces.length > 1) {
				        var prevId = pieces[0] + "-Rev" + (pieces[1] - 1).toString();
				        var dfd = $q.defer();
                        var lang;
                        if(Buyer.ID.substring(0,5) === 'WPIFR' && Buyer.xp.Lang) {
                            lang = Buyer.xp.Lang.id;
                        }
			            //var isImpersonating = typeof (OrderCloudSDK.GetImpersonationToken()) != 'undefined' ? true : false;
				        var direction = /*isImpersonating == true ? 'Outgoing' :*/ "Incoming";
				        OrderCloudSDK.LineItems.List(direction, prevId, { 'filters': { 'Order.xp.BuyerID': Order.xp.BuyerID } })
					        .then(function(data) {
						        if (!data.Items.length) {
							        dfd.resolve({ Items: [] });
						        } else {
							        LineItemHelpers.GetBlankProductInfo(data.Items);
							        LineItemHelpers.GetProductInfo(data.Items, Order)
								        .then(function () {
								            if (lang && data.Items) {
								                for (var i = 0; i < data.Items.length; i++) {
								                    var tmp = data.Items[i];
								                    if (tmp.Product && tmp.Product.xp && tmp.Product.xp[lang]) {
								                        tmp.xp.Description = tmp.Product.xp[lang].Description || tmp.xp.Description;
								                    }
								                }
								            }
								            dfd.resolve(data);
								        });
						        }
					        })
					        .catch(function () {
						        dfd.resolve({ Items: [] });
					        });
				        return dfd.promise;
			        } else {
			        	return null;
			        }
		        },
                PreviousOrderShipping: function($q, toastr, OrderCloudSDK, Order, CurrentBuyer) {
                    var pieces = Order.ID.split('-Rev');
                    var buyerId = CurrentBuyer.GetBuyerID();
                    if(pieces.length > 1) {
                        var prevId = pieces[0] + "-Rev" + (pieces[1] - 1).toString();
                        var dfd = $q.defer();
                        //var isImpersonating = typeof (OrderCloudSDK.GetImpersonationToken()) != 'undefined' ? true : false;
                        var direction = /*isImpersonating == true ? 'Outgoing' :*/ "Incoming";
                        OrderCloudSDK.Orders.Get(/* DIRECTION NEEDED */direction, prevId)
                    .then(function(data) {
								dfd.resolve( data.ShippingCost );
                            })
                            .catch(function () {
                                dfd.resolve(0);
                            });
                        return dfd.promise;
                    } else {
                        return null;
                    }
                },
	            Payments: function (Order, OrderCloudSDK) {
	                //var isImpersonating = typeof (OrderCloudSDK.GetImpersonationToken()) != 'undefined' ? true : false;
	                var direction = /*isImpersonating == true ? 'Outgoing' :*/ "Incoming";
	                return OrderCloudSDK.Payments.List(direction, Order.ID, { 'filters': { 'Order.xp.BuyerID': Order.xp.BuyerID } });
	            },
	            UserGroups: function (UserGroupsService) {
	                return UserGroupsService.UserGroups();
	            },
		        Catalog: function(OrderCloudSDK,Buyer) {
			        return OrderCloudSDK.Catalogs.Get(Buyer.xp.WeirGroup.label);
		        }
	        }
        })
	    .state('order.addinfo', {
	        url: '/addinfo',
	        templateUrl: 'order/templates/order.addinfo.tpl.html',
	        controller: 'FinalOrderInfoCtrl',
	        controllerAs: 'info',
	        resolve: {
	            Order: function (CurrentOrder) {
	                return CurrentOrder.Get();
	            }
	        }
	    });
}

function OrderController($q, $rootScope, $state, $sce, $exceptionHandler, UserGroupsService,
                         OrderCloudSDK, Order, DeliveryAddress, LineItems, PreviousLineItems, Payments, Me, WeirService,
                         Underscore, OrderToCsvService, buyernetwork, fileStore, OCGeography, toastr, FilesService, FileSaver,
                         UserGroups, BackToListService, Buyer, Catalog) {
	determineShipping();
    var vm = this;
    vm.Order = Order;
	vm.Order.xp.PONumber = vm.Order.xp.PONumber != "Pending" ? vm.Order.xp.PONumber : ""; // In the buyer app we were initially setting this to pending.
    vm.BlankItems = [];
    vm.NoOp = function () { };
    var userIsInternalSalesAdmin = UserGroups.indexOf(UserGroupsService.Groups.InternalSales) > -1;
    var userIsSuperAdmin = UserGroups.indexOf(UserGroupsService.Groups.SuperAdmin) > -1;

    vm.getLanguage = function() {
    	Buyer.xp.Lang = Buyer.xp.Lang || {};
        Buyer.xp.Lang.id = Buyer.xp.Lang.id || "";
    	return Buyer.xp.Lang.id.toUpperCase();
	};
    function notUpdated(newObj, oldObj)
	{
		return newObj === oldObj;
	}
	//Part of the label comparison
	function compare(current,previous) {
        if (notUpdated(current.Quantity, previous.Quantity) &&
            notUpdated(current.UnitPrice, previous.UnitPrice) &&
            notUpdated(current.xp.TagNumber, previous.xp.TagNumber) &&
            notUpdated(current.xp.SN, previous.xp.SN) &&
            notUpdated(current.xp.LeadTime, previous.xp.LeadTime) &&
            notUpdated(current.xp.ReplacementSchedule , previous.xp.ReplacementSchedule) &&
            notUpdated(current.xp.Description , previous.xp.Description) &&
            notUpdated(current.xp.ProductName , previous.xp.ProductName)
		) {
            return null;
        }
        else {
            return "UPDATED";
        }
    }

	if(LineItems && PreviousLineItems) { //hopefully an easier way to set labels.
		// For each line item, does it exist in previous line items?  If NO then NEW, else are the fields different between the two? If YES then updated.
		vm.LineItems = Underscore.filter(LineItems.Items, function(item) {
			console.log(item);
			var found = false;
			if(item.ProductID == "PLACEHOLDER") { //Match a blank line item
				angular.forEach(PreviousLineItems.Items, function(value, key) {
					if(value.xp.SN == item.xp.SN) {
						found = true;
						item.displayStatus = compare(item,value);
					}
				});
			} else { // Match regular line items
				angular.forEach(PreviousLineItems.Items, function(value, key) {
					if(value.ProductID === item.ProductID) {
						found = true;
						item.displayStatus = compare(item,value);
					}
				});
			}

			if(!found) {
				//new!
				item.displayStatus = "NEW";
			}

			return item;
		});
	} else {
		vm.LineItems = LineItems.Items;
	}

	if(PreviousLineItems) {
		vm.PreviousLineItems = Underscore.filter(PreviousLineItems.Items, function (item) {
			if(item.ProductID == "PLACEHOLDER") {
				var found = false;
				angular.forEach(LineItems.Items, function(value, key) {
					if(value.xp.SN == item.xp.SN) {
						found = true;
						return;
					}
				});
				if(found) {
					return;
				} else {
					item.displayStatus="DELETED";
					return item; //Deleted blank line item.
				}
			} else {
				if (Underscore.findWhere(LineItems.Items, {ProductID:item.ProductID})) {
					return;
				} else {
					item.displayStatus="DELETED";
					return item; //Deleted normal line item.
				}
			}
		});
	} else {
		vm.PreviousLineItems = null;
	}
    vm.DeliveryAddress = DeliveryAddress;
    vm.Status = Underscore.find(WeirService.OrderStatus, function(status) {
        return status.id == vm.Order.xp.Status;
    });
    vm.Payments = Payments;
	vm.CommentToWeir = "";
	vm.fileStore = fileStore;

    OCGeography.Countries()
        .then(function(countries) {
            vm.countries = countries;
        });

	vm.country = function (c) {
		var result = Underscore.findWhere(vm.countries, { code: c });
        vm.Order.CountryName = result ? result.name : '';
		return result ? result.name : '';
	};

    vm.showReviewer = [WeirService.OrderStatus.Submitted.id, WeirService.OrderStatus.Review.id,
			WeirService.OrderStatus.SubmittedWithPO.id, WeirService.OrderStatus.SubmittedPendingPO.id,
			WeirService.OrderStatus.RevisedQuote.id, WeirService.OrderStatus.RevisedOrder.id,
			WeirService.OrderStatus.SubmittedPendingPO.id, WeirService.OrderStatus.ConfirmedQuote.id,
			WeirService.OrderStatus.Enquiry.id, WeirService.OrderStatus.EnquiryReview.id].indexOf(vm.Order.xp.Status) > -1;
	vm.showAssign = vm.showReviewer && (Me.ID != vm.Order.xp.ReviewerID) && (userIsInternalSalesAdmin || userIsSuperAdmin);

    vm.LineItemZero = function() {
    	return Underscore.findWhere(vm.LineItems,{LineTotal:0});
    };

    vm.InvalidPO = function() {
        return vm.Order.xp.Type=="Order" && ((vm.Order.xp.PONumber == "Pending" || vm.Order.xp.PONumber == "") /* PO-517 || (vm.Order.xp.PODocument == "" || vm.Order.xp.PODocument == null)*/);
    };

    var labels = {
        en: {
            //header labels
            status: "Status",
            reviewer: "Reviewer; ",
			Language: "Language;",
            unassigned: "Not assigned",
            AssignToMe: "Assign to me",
            OrderDate: "Order date;",
            Confirm: "Confirm",
            Revise: "Revise",
            ShareRevision: "Share revision",
	        Update: "Update",
            Comments: "Comments",
            Download: "Download",
            Print: "Print",
            //paragraph above table
            WeirOrderNo: "Weir Order No;",
	        WeirQuoteNo: "Weir Quote No;",
            QuoteRef: "Your quote ref;",
            PONumber: "Your PO No;",
            //table labels
            SerialNum: "Serial number",
            TagNum: "Tag number (if available)",
            PartNum: "Part Number",
            Description: "Description of Part",
            RecReplacement: "Recommended replacement",
            LeadTimeAvailability: "Lead time / Availability",
            PricePerItem: "Price Per Item",
            Quantity: "Quantity",
            Total: "Total",
            //labels to right of table
            Edit: "Save",
            Removed: "Removed",
            Updated: "Updated",
            New: "New",
            //buttons above table
            BackToQuote: "Back to Quotes",
            AddNewItems: "Add new items",
            AddABlankItem: "Add a blank item",
            //footers
            YourRefNo: "Your Reference No;",
            DeliveryAddress: "Delivery Address",
            YourAttachments: "Your attachments",
            YourComments: "Your comments or instructions",
	        Directions: "Select Save to update lead time, price or quantity.",
	        DirectionsCont: "You can also add new items from the search or you can add blank items which you can complete with the required details.",
	        Comment: "Comment",
	        AddedComment: " added a comment - ",
	        Add: "Add",
	        Cancel: "Cancel",
	        POSaveTitle: "PO Number Updated",
	        POSaveMessage: "PO Number saved as: ",
	        DragAndDrop: "Drag and drop files here to upload",
	        OrderAssignedMsg: "This order has been assigned to you",
            QuoteAssignedMsg: "This quote has been assigned to you",
	        POPlaceHolder: "Enter PO Number",
	        PONote: "You can also upload a PO document using the upload button below the order details",
	        Currency: "Currency",
	        Back: "Back",
            CarriageCharge: "Carriage charge",
            Exworks: "Carriage ex-works",
	        //Eunquiry table
	        PartTypes: "Part types for;",
	        Brand: "Brand",
	        ValveType: "Valve type"
        },
        fr: {
            //header labels
            status: $sce.trustAsHtml("Status"),
            reviewer: "Reviewer; ",
            Language: "Language;",
            unassigned: "Not assigned",
            OrderDate:$sce.trustAsHtml( "Order date;"),
            AssignToMe: "Assign to me",
            Confirm: $sce.trustAsHtml("Confirm"),
            Revise:$sce.trustAsHtml( "Revise"),
            ShareRevision:$sce.trustAsHtml( "Share revision"),
	        Update: $sce.trustAsHtml("Update"),
            Comments:$sce.trustAsHtml( "Comments"),
            Download:$sce.trustAsHtml( "Download"),
            Print:$sce.trustAsHtml( "Print"),
            //paragraph above table
            WeirOrderNo:$sce.trustAsHtml( "Weir Order No;"),
	        WeirQuoteNo: $sce.trustAsHtml( "Weir Quote No;"),
            QuoteRef:$sce.trustAsHtml( "Your quote ref;"),
            PONumber:$sce.trustAsHtml( "Your PO No;"),
            //table labels
            SerialNum:$sce.trustAsHtml( "Serial number"),
            TagNum:$sce.trustAsHtml( "Tag number (if available)"),
            PartNum:$sce.trustAsHtml( "Part Number"),
            Description:$sce.trustAsHtml( "Description of Part"),
            RecReplacement:$sce.trustAsHtml( "Recommended replacement"),
            LeadTimeAvailability:$sce.trustAsHtml( "Lead time / Availability"),
            PricePerItem:$sce.trustAsHtml( "Price Per Item"),
            Quantity:$sce.trustAsHtml( "Quantity"),
            Total:$sce.trustAsHtml( "Total"),
            //labels to right of table
            Edit:$sce.trustAsHtml( "Save"),
            Removed:$sce.trustAsHtml( "Removed"),
            Updated:$sce.trustAsHtml( "Updated"),
            New:$sce.trustAsHtml( "New"),
            //buttons above table
            BackToQuote:$sce.trustAsHtml( "Back to Quotes"),
            AddNewItems:$sce.trustAsHtml( "Add new items"),
            AddABlankItem:$sce.trustAsHtml( "Add a blank item"),
            //footers
            YourRefNo:$sce.trustAsHtml( "Your Reference No;"),
            DeliveryAddress:$sce.trustAsHtml("Delivery Address"),
            YourAttachments:$sce.trustAsHtml( "Your attachments"),
            YourComments:$sce.trustAsHtml( "Your comments or instructions"),
	        Directions: $sce.trustAsHtml("Select Save to update lead time, price or quantity."),
	        DirectionsCont: $sce.trustAsHtml("You can also add new items from the search or you can add blank items which you can complete with the required details."),
	        Comment: $sce.trustAsHtml("Comment"),
	        AddedComment: $sce.trustAsHtml(" added a comment - "),
	        Add: $sce.trustAsHtml("Add"),
	        Cancel: $sce.trustAsHtml("Cancel"),
	        POSaveTitle: $sce.trustAsHtml("PO Number Updated"),
	        POSaveMessage: $sce.trustAsHtml("PO Number saved as: "),
	        DragAndDrop: $sce.trustAsHtml("Drag and drop files here to upload"),
	        OrderAssignedMsg: $sce.trustAsHtml("This order has been assigned to you"),
	        QuoteAssignedMsg: $sce.trustAsHtml("This quote has been assigned to you"),
	        POPlaceHolder: $sce.trustAsHtml("Enter PO Number"),
	        PONote: $sce.trustAsHtml("You can also upload a PO document using the upload button below the order details"),
	        Currency: $sce.trustAsHtml("Currency"),
	        Back: "Back",
	        CarriageCharge: "Carriage charge",
	        Exworks: "Carriage ex-works",
	        //Enquiry table
	        PartTypes: $sce.trustAsHtml("Part types for;"),
	        Brand: $sce.trustAsHtml("Brand"),
	        ValveType: $sce.trustAsHtml("Valve type")
        }
    };
    vm.labels = labels[WeirService.Locale()];

	vm.BackToList = function() {
		BackToListService.GoToLocation();
	};

	vm.UpdatePO = function() {
		if(vm.Order.xp.PONumber != "Pending" && vm.Order.xp.PONumber != '') {
			var data = {
				xp: {
					Type: 'Order',
					Status: WeirService.OrderStatus.SubmittedWithPO.id,
					StatusDate: new Date(),
					ReviewerName: Me.FirstName + " " + Me.LastName,
					PONumber: vm.Order.xp.PONumber,
                    POEnteredByWeir: true,
					PendingPO: false
				}
			};
			if (vm.Order.xp.ReviewerID != Me.ID) {
			    data.xp.ReviewerID = Me.ID;
			    data.xp.ReviewerEmail = Me.Email;
			}

			//var isImpersonating = typeof (OrderCloudSDK.GetImpersonationToken()) != 'undefined' ? true : false;
			var direction = /*isImpersonating == true ? 'Outgoing' :*/ "Incoming";
			OrderCloudSDK.Orders.Patch(direction, vm.Order.ID, data)
				.then(function (order) {
					toastr.success(vm.labels.POSaveMessage + order.xp.PONumber, vm.labels.POSaveTitle);
					$state.go($state.current, {}, {reload: true});
				})
				.catch(function (ex) {
					$exceptionHandler(ex);
				});
		}
	};

    vm.ToCsvJson = toCsv;
	function toCsv() {
		return OrderToCsvService.ToCsvJson(vm.Order, vm.LineItems, vm.DeliveryAddress, vm.Payments, vm.labels);
	}
    vm.CsvFilename = vm.Order.ID + ".csv";

	vm.ShowEdit = _showEdit;
	function _showEdit(status, item) {
		return status==WeirService.OrderStatus.Review.id || status==WeirService.OrderStatus.EnquiryReview.id;
	}

	vm.ShowUpdated = function (item) {
		// return true if qty <> xp.originalQty and qty > 0
		if(item.xp) {
			return (item.xp.OriginalQty && (item.Quantity != item.xp.OriginalQty)) ||
				(typeof item.xp.OriginalUnitPrice !== "undefined" &&
					(
						item.xp.OriginalUnitPrice !== 0 &&
						(
							item.UnitPrice != item.xp.OriginalUnitPrice
						)
					)
				) ||
				(typeof item.xp.OriginalLeadTime !== "undefined" &&
					(
						(typeof item.xp.LeadTime !== "undefined" && (item.xp.OriginalLeadTime !== item.xp.LeadTime))
					)
				) ||
				(typeof item.xp.OriginalReplacementSchedule !== "undefined" &&
					(
						(typeof item.xp.ReplacementSchedule !== "undefined" && (item.xp.OriginalReplacementSchedule !== item.xp.ReplacementSchedule))
					)
				) ||
				(typeof item.xp.OriginalDescription !== "undefined" &&
					(
						(typeof item.xp.Description !== "undefined" && (item.xp.OriginalDescription !== item.xp.Description))
					)
				) ||
				(typeof item.xp.OriginalProductName !== "undefined" &&
					(
						(typeof item.xp.ProductName !== "undefined" && (item.xp.OriginalProductName !== item.xp.ProductName))
					)
				) ||
				(typeof item.xp.OriginalTagNumber !== "undefined" &&
					typeof item.xp.TagNumber !== "undefined" &&
					(item.xp.TagNumber !== item.xp.OriginalTagNumber)) ||
				(typeof item.xp.OriginalSN !== "undefined" && typeof item.xp.SN !== "undefined" && (item.xp.SN !== item.xp.OriginalSN))
		} else {
			return false;
		}
	};

	vm.ShowRemoved = _showRemoved;
	function _showRemoved(line) {
		if(line.xp) {
			return line.Quantity == 0 && line.xp.OriginalQty != 0;
		} else {
			return false;
		}
	}

	vm.ShowNew = _showNew;
	function _showNew(line) {
		if(line.xp) {
			return line.xp.OriginalQty==0 || (vm.Order.ID.indexOf("Rev") != -1 && line.xp.OriginalQty==null); //Second part matches items added in admin search.
		} else {
			return false;
		}
	}

	vm.ShowConfirm = _showConfirm;
	function _showConfirm() {
		var validStatus = {
			SB: true,
			SP: true,
			SE: true
		};
		if(vm.Order.xp) {
			return validStatus[vm.Order.xp.Status] && vm.Order.xp.ReviewerID == Me.ID;
		} else {
			return false;
		}
	}

	vm.ShowRevise = _showRevise;
	function _showRevise() {
		var validStatus = {
			SB: true,
			SP: true,
			RQ: true,
			RR: true,
			SE: true,
			EN: true
		};
		if(vm.Order.xp) {
			return validStatus[vm.Order.xp.Status] && vm.Order.xp.ReviewerID == Me.ID;
		} else {
			return false;
		}
	}

	vm.ShowShareRevision = _showShareRevision;
	function _showShareRevision() {
		var validStatus = {
			RE: true,
			ER: true
		};
		if(vm.Order.xp) {
			return validStatus[vm.Order.xp.Status];
		} else {
			return false;
		}
	}

	vm.ShowUpdate = _showUpdate;
	function _showUpdate() {
		var validStatus = {
			CO: true,
			DP: true,
			IV: true
		};
		if(vm.Order.xp) {
			return validStatus[vm.Order.xp.Status];
		} else {
			return false;
		}
	}

	vm.ShowAddItems = _showAddItems;
	function _showAddItems() {
		var validStatus = {
			RE: true,
			ER: true
		};
		if(vm.Order.xp) {
			return validStatus[vm.Order.xp.Status];
		} else {
			return false;
		}
	}

	vm.GetFile = function(fileName) {
		var orderid = vm.Order.xp.OriginalOrderID ? vm.Order.xp.OriginalOrderID : vm.Order.ID;
		FilesService.Get(orderid + fileName)
			.then(function(fileData) {
				console.log(fileData);
				var file = new Blob([fileData.Body], {type: fileData.ContentType});
				FileSaver.saveAs(file, fileName);
			});
	};

	vm.AddBlankItem = _addBlankItem;
	function _addBlankItem(line) {
		if(line) {
			var item = {
				ProductID: line.ProductID,
				UnitPrice: line.UnitPrice,
				Quantity: line.Quantity,
				xp: {
					SN: line.xp.SN,
					TagNumber: line.xp.TagNumber,
					ProductName: line.xp.ProductName,
					Description: line.xp.Description,
					ReplacementSchedule: line.xp.ReplacementSchedule,
					LeadTime: line.xp.LeadTime
				}
			};
			//var isImpersonating = typeof (OrderCloudSDK.GetImpersonationToken()) != 'undefined' ? true : false;
			var direction = /*isImpersonating == true ? 'Outgoing' :*/ "Incoming";
			OrderCloudSDK.LineItems.Create(direction, vm.Order.ID, item)
				.then(function () {
					$rootScope.$broadcast('SwitchCart');
					$state.go($state.current, {}, {reload: true});
				})
				.catch(function (ex) {
					$exceptionHandler(ex);
					$state.go($state.current, {}, {reload: true});
				});
		} else {
			var newItem = {
				"ProductID": "PLACEHOLDER",
				"Quantity": 1,
				"DateAdded": "",
				"QuantityShipped": 0,
				"UnitPrice": 0,
				"LineTotal": 0,
				"CostCenter": null,
				"DateNeeded": null,
				"ShippingAccount": null,
				"ShippingAddressID": null,
				"ShippingAddress": null,
				"ShipFromAddressID": null,
				"ShipFromAddress": null,
				"Specs": [],
				"xp": {
					"SN": null,
					"TagNumber": null,
					"ProductName": null,
					"Description": null,
					"ReplacementSchedule": 0,
					"LeadTime": 0
				}
			};
			vm.BlankItems.push(newItem);
		}
	}
	function mapValuesForProperties(obj1, obj2, defaultVal)
	{
		if(obj1)
		{
			return obj1;
		}
		else if(obj2)
		{
			return obj2;
		}
		else
		{
			return defaultVal;
		}
	}
	vm.saveLineItems = function() {
		var queue = [];
		var deferred = $q.defer();
		var direction = "Incoming";

		angular.forEach(vm.LineItems, function(line,key) {
			var d = $q.defer();
			queue.push((function() {
				if(line.Quantity > 0) {
					// Is this a placeholder item?
					var patch = {
                            UnitPrice: line.UnitPrice,
                            Quantity: line.Quantity,
                            xp: {
                                SN: line.xp.SN,
                                TagNumber: line.xp.TagNumber,
                                ProductName: line.xp.ProductName,
                                Description: line.xp.Description,
                                ReplacementSchedule: line.xp.ReplacementSchedule,
                                LeadTime: line.xp.LeadTime
                            }
                        };
					OrderCloudSDK.LineItems.Patch(direction, vm.Order.ID, line.ID, patch)
						.then(function (results) {
							d.resolve(results);
						})
						.catch(function (ex) {
							d.resolve(ex);
						});
				} else {
					OrderCloudSDK.LineItems.Delete(direction, vm.Order.ID, line.ID)
						.then(function (results) {
							d.resolve(results);
						})
						.catch(function (ex) {
							d.resolve(ex);
						});
				}
				return d.promise;
			})());
		});

		$q.all(queue)
			.then(function(temp) {
				deferred.resolve(temp);
			})
			.catch(function(ex) {
				deferred.resolve(ex);
			});

		return deferred.promise;
	};

	vm.EditLineItems = _editLineItems;
    function _editLineItems() {
    	vm.saveLineItems();
	    $rootScope.$broadcast('SwitchCart');
	    $state.go($state.current, {}, {reload: true});
    }

    vm.EditOrderShipping = _editShipping;
    function _editShipping() {
        //var isImpersonating = typeof (OrderCloudSDK.GetImpersonationToken()) != 'undefined' ? true : false;
        var direction = /*isImpersonating == true ? 'Outgoing' :*/ "Incoming";
        var patch = {
            ShippingCost : vm.Order.ShippingCost,
            xp: {
                ShippingDescription:  vm.Order.xp.ShippingDescription != null ? vm.Order.xp.ShippingDescription : null
            }
        };
        OrderCloudSDK.Orders.Patch(direction, vm.Order.ID, patch)
            .then(function () {
                $state.go($state.current, {}, {reload: true});
            })
            .catch(function (ex) {
                $exceptionHandler(ex);
            });
    }

    vm.ShowUpdatedShipping = function () {
    	if(vm.Order.xp.OldShippingData) {
            if (vm.Order.ShippingCost != vm.Order.xp.OldShippingData.ShippingCost || vm.Order.xp.ShippingDescription != vm.Order.xp.OldShippingData.ShippingDescription) {
                if(vm.Order.xp.WasEnquiry  == true && vm.Order.xp.OldShippingData.ShippingCost === 0 && vm.Order.ShippingCost > 0
                    && vm.Order.xp.OldShippingData.ShippingDescription == null)
                {

                    return false;
                }
                else return true;
            } else {
                return false;
            }
        }
        else {
    		return false;
		}
    };

	vm.AddLineItem = _addLineItem;//A previous line item being returned to the current order.
	function _addLineItem(line) {
		if(line.TempQty > 0) {
			line.ID = null;
			line.Quantity = line.TempQty;
			line.DateAdded = new Date();
			//line.xp.OriginalQty = line.xp.OriginalQty ? line.xp.OriginalQty : 0;
			//var isImpersonating = typeof (OrderCloudSDK.GetImpersonationToken()) != 'undefined' ? true : false;
			var direction = /*isImpersonating == true ? 'Outgoing' :*/ "Incoming";
			OrderCloudSDK.LineItems.Create(direction, vm.Order.ID, line)
				.then(function () {
					$rootScope.$broadcast('SwitchCart');
					$state.go($state.current, {}, {reload: true});
				})
				.catch(function (ex) {
					$exceptionHandler(ex);
					$rootScope.$broadcast('SwitchCart');
					$state.go($state.current, {}, {reload: true});
				});
		}
	}

	vm.ShareRevision = _shareRevision;
	function _shareRevision(currentUser) {
		//Set the status to revised. set the status date. set the ReviewerName.
		var orderType = {
			Quote: WeirService.OrderStatus.RevisedQuote.id,
			Order: WeirService.OrderStatus.RevisedOrder.id
		};

		var patch = {
			ShippingCost: vm.Order.ShippingCost,
			xp: {
				Status: orderType[vm.Order.xp.Type],
				StatusDate: new Date(),
				ReviewerName: currentUser.FirstName + " " + currentUser.LastName,
				ShippingDescription: vm.Order.xp.ShippingDescription
			}
		};
		if (vm.Order.xp.ReviewerID != currentUser.ID) {
		    patch.xp.ReviewerID = currentUser.ID;
		    patch.xp.ReviewerEmail = currentUser.Email;
		}

		if(patch.xp.Status) {
		    //var isImpersonating = typeof (OrderCloudSDK.GetImpersonationToken()) != 'undefined' ? true : false;
		    var direction = /*isImpersonating == true ? 'Outgoing' :*/ "Incoming";
		    OrderCloudSDK.Orders.Patch(direction, vm.Order.ID, patch)
				.then(function(order) {
					$state.go($state.current,{}, {reload:true});
				})
				.catch(function(ex) {
					$exceptionHandler(ex);
				});
		}
	}

	vm.AddNewComment = function() {
		if(vm.CommentToWeir) {
			var comment = {
				date: new Date(),
				by: Me.FirstName + " " + Me.LastName,
				val: vm.CommentToWeir,
				IsWeirComment: true
			};
			if(vm.Order.xp.CommentsToWeir == null) {
				vm.Order.xp.CommentsToWeir = [];
			}
			vm.Order.xp.CommentsToWeir.push(comment);
			//var isImpersonating = typeof (OrderCloudSDK.GetImpersonationToken()) != 'undefined' ? true : false;
			var direction = /*isImpersonating == true ? 'Outgoing' :*/ "Incoming";
			OrderCloudSDK.Orders.Patch(direction, vm.Order.ID, { xp: { CommentsToWeir: vm.Order.xp.CommentsToWeir } })
				.then(function(order) {
					vm.CommentToWeir = "";
					$state.go($state.current,{}, {reload:true});
				})
				.catch(function(ex) {
					$exceptionHandler(ex);
				})
		} else {
			toastr.info("Cannot save an empty comment.","Empty Comment");
		}
	};

	vm.Confirm = _confirm;
	function _confirm(currentUser) {
		var confirmedStatus = {
			SB:WeirService.OrderStatus.ConfirmedQuote.id,
			SP:WeirService.OrderStatus.ConfirmedOrder.id
		};

		var patch = {
			xp: {
				Status: confirmedStatus[vm.Order.xp.Status],
				StatusDate: new Date(),
				ReviewerName: currentUser.FirstName + " " + currentUser.LastName
			}
		};
		if (vm.Order.xp.ReviewerID != currentUser.ID) {
		    patch.xp.ReviewerID = currentUser.ID;
		    patch.xp.ReviewerEmail = currentUser.Email;
		}

		if(patch.xp.Status) {
		    //var isImpersonating = typeof (OrderCloudSDK.GetImpersonationToken()) != 'undefined' ? true : false;
		    var direction = /*isImpersonating == true ? 'Outgoing' :*/ "Incoming";
		    OrderCloudSDK.Orders.Patch(direction, vm.Order.ID, patch)
				.then(function(order) {
					vm.order = order;
					//$state.go($state.current,{}, {reload:true});
					$state.transitionTo($state.current, $state.$current.params, { reload: true, inherit: true, notify: true });
				})
				.catch(function(ex) {
					$exceptionHandler(ex);
				});
		} else {
			return; //invlaid status for confirming. should not have shown the button.
		}
	}

	vm.Update = _update;
	function _update() {
		$state.go('order.addinfo');
	}

	vm.Revise = _revise;
	function _revise(currentUser) {
		var deferred = $q.defer();
		var queue = [];
		var OrderID = null; //Need this to be able to patch to the new ID.
		// On the first revision there will be no original order id, so set it. This way we can see all related items in the revisions list view.
		vm.Order.xp.OriginalOrderID = vm.Order.xp.OriginalOrderID ? vm.Order.xp.OriginalOrderID: vm.Order.ID;

		// Make deep copies so changes to one do not change the other.
		var orderCopy = angular.copy(vm.Order);
		var lineItemsCopy = angular.copy(vm.LineItems); //a 'new line' would have original qty 0; a deleted line would have orig qty <> 0

		// The copy will be the historical version of the order. This way we maintain the submission status in the original
		orderCopy.xp.Active = false;
            if(vm.Order.xp.Type == "Quote") {
                orderCopy.xp.Status = WeirService.OrderStatus.RevisedQuote.id;
		} else if (vm.Order.xp.Type == "Order") {
			orderCopy.xp.Status = WeirService.OrderStatus.RevisedOrder.id;
		} else {
			return; //shouldn't have an order with no xp.Type
		}

		orderCopy.xp.StatusDate = new Date();

		function _determineRevision(orderID) {
			var rev = null;
			var pieces = orderID.split("-Rev");
			angular.forEach(pieces, function(value, key) {
				if(key==1) {
					value++;
					rev = pieces[0] + "-Rev" + value.toString();
				} else {
					rev = orderID + "-Rev1"; //There is no revision. Set it to 1.
				}
			});
			return rev;
		}

		function _determineCopyRevision(orderID) {
			var rev = null;
			var pieces = orderID.split("-Rev");
			angular.forEach(pieces, function(value, key) {
				if(key==1) {
					rev = pieces[0] + "-Rev" + value.toString();
				} else {
					rev = orderID + "-Rev0"; //There is no revision. Set it to 0.
				}
			});
			return rev;
		}
		// pass in the copy order id. Use that to set the copy and the order.
		orderCopy.ID = _determineCopyRevision(orderCopy.ID); //Rev0 or current rev
		OrderID = angular.copy(vm.Order.ID);
		vm.Order.ID = _determineRevision(vm.Order.ID);
		//ToDo Use EnquiryReview status.
		// if current status is Enquiry, then set to EnquiryReview, else set to
		var status = vm.Order.xp.Status == "EN" ? WeirService.OrderStatus.EnquiryReview.id : WeirService.OrderStatus.Review.id;
		var orderPatch = {
			ID: vm.Order.ID,
            ShippingCost: vm.Order.ShippingCost,
			xp: {
				Active: true,
				Status: status,
				StatusDate: new Date(),
				ReviewerName: currentUser.Username,
				RevisedDate: new Date(),
				Revised: true,
				ShippingDescription: vm.Order.xp.ShippingDescription != null ? vm.Order.xp.ShippingDescription : null,
				OriginalOrderID: vm.Order.xp.OriginalOrderID,
				OldShippingData: {
					ShippingCost : vm.Order.ShippingCost ,
					ShippingDescription: vm.Order.xp.ShippingDescription != null ? vm.Order.xp.ShippingDescription : null
				}
			}
		};
		if (orderPatch.xp.WasEnquiry && (orderPatch.xp.Status == WeirService.OrderStatus.EnquiryReview.id)) { //The first revision.
			orderPatch.xp.WasEnquiry = vm.Order.xp.WasEnquiry; //Needed for the enquiry webhook.
		} else if (orderPatch.xp.WasEnquiry && orderPatch.xp.WasEnquiry == true) { //second revision.
			orderPatch.xp.WasEnquiry = false;
		}
		if (vm.Order.xp.ReviewerID != currentUser.ID) {
		    orderPatch.xp.ReviewerID = currentUser.ID;
		    orderPatch.xp.ReviewerEmail = currentUser.Email;
        }

		var impersonation = {
			ClientID: buyernetwork,
			Roles: []
		};

		// Patch the current order with the updated status, ID and active state.
		//var isImpersonating = typeof (OrderCloudSDK.GetImpersonationToken()) != 'undefined' ? true : false;
		var direction = "Incoming"; /*isImpersonating == true ? 'Outgoing' :*/

        OrderCloudSDK.Users.Get(vm.Order.xp.BuyerID, vm.Order.FromUser.ID)
			.then(function(buyer) {
                impersonation.Roles = buyer.AvailableRoles;
                return OrderCloudSDK.Users.GetAccessToken(vm.Order.xp.BuyerID, vm.Order.FromUser.ID, impersonation);
			})
            .then(function(data) {
                // Set the local impersonation token so that As() can be used.
                return OrderCloudSDK.SetImpersonationToken(data['access_token']);
            })
            .then(function() {
                return OrderCloudSDK.Orders.Patch(direction, OrderID, orderPatch);
            })
            .then(function() {
                // Create the order as the impersonated user.
                return OrderCloudSDK.As().Orders.Create("Outgoing", orderCopy);
                //ToDo make another then in order to set the shipping address.
            })
			.then(function() {
				// Create the line items.
				angular.forEach(lineItemsCopy, function(value, key) {
					queue.push(OrderCloudSDK.LineItems.Create("Incoming", orderCopy.ID, value));
				});
				$q.all(queue)
					.then(function() {
						return OrderCloudSDK.Orders.Submit("Incoming", orderCopy.ID);
					});
			})
			.then(function() {
				// Remove the impersonation token.
				return OrderCloudSDK.RemoveImpersonationToken();
			})
			.then(function() {
				// Set the current order so that the order details page is updated. The current order ID has been incremented.
				var lang;
				if (Buyer.xp.Lang) { lang = Buyer.xp.Lang.id; }
				return WeirService.SetOrderAsCurrentOrder(vm.Order.ID, lang);
			})
			.then(function() {
				// Update the mini-cart with the new order and refresh the page.
				$rootScope.$broadcast('SwitchCart');
				$state.go($state.current,{}, {reload:true});
			})
			.catch(function(ex) {
				$exceptionHandler(ex);
				$rootScope.$broadcast('SwitchCart');
				$state.go($state.current,{}, {reload:true});
			});
	}

	vm.AssignToMe = _assignToMe;
	function _assignToMe() {
	    var newID = Me.ID;
	    var oldID = vm.Order.xp.ReviewerID;
	    if (newID && (newID != oldID)) {
	        var data = {
	            xp: {
	                ReviewerID: newID,
	                ReviewerName: Me.FirstName + " " + Me.LastName,
                    ReviewerEmail: Me.Email
	            }
	        };
	        if (oldID) {
	            data.xp.PriorReviewerID = oldID;
	        }
	        //var isImpersonating = typeof (OrderCloudSDK.GetImpersonationToken()) != 'undefined' ? true : false;
	        var direction = /*isImpersonating == true ? 'Outgoing' :*/ "Incoming";
	        OrderCloudSDK.Orders.Patch(direction, vm.Order.ID, data)
            .then(function (order) {
                vm.Order = order;
                vm.showAssign = false;
                if (vm.Order.xp.Type == 'Quote') {
                    toastr.success(vm.labels.QuoteAssignedMsg);
                } else {
                    toastr.success(vm.labels.OrderAssignedMsg);
                }
            });
	    }
	}

	function determineShipping() {
		if (Order.xp.ShippingDescription !== null) return;
		// No shipping is set for the order. Determine defaults.
		Order.xp.ShippingDescription = "Carriage charge";
		Order.xp.CarriageRateType = "standard";
		if(Buyer.xp.UseCustomCarriageRate === true) {
			Order.ShippingCost = Buyer.xp.CustomCarriageRate;
		} else {
			Order.ShippingCost = Catalog.xp.StandardCarriage;
		}
	}
}

function FinalOrderInfoController($sce, $state, $rootScope, $exceptionHandler, OrderCloudSDK, WeirService, Order) {
	var vm = this;
    vm.Order = Order;
    vm.Order.xp.DateDespatched = vm.Order.xp.DateDespatched ? new Date(vm.Order.xp.DateDespatched) : null;
    vm.Order.xp.DeliveryDate = vm.Order.xp.DeliveryDate ? new Date(vm.Order.xp.DeliveryDate) : null;
	vm.popupDespatched = {
		opened: false
	};
	vm.popupDelivery = {
		opened: false
	};
	vm.inlineOptions = {
		minDate: new Date(),
		showWeeks: true
	};
	vm.dateOptions = {
		formatYear: 'yyyy',
		maxDate: new Date(2050, 12, 31),
		minDate: new Date(2000, 1, 1),
		startingDay: 1
	};
	vm.altInputFormats = ['d!/M!/yyyy'];

    var labels = {
        en: {
            OrderNumber: "Order Number",
            BackToOrders: "Back to Orders",
            ContractNumber: "Contract number",
            DeliveryDate: "Delivery date",
            DespatchDate: "Date despatched",
            InvoiceNum: "Invoice Number",
            NotificationText: "Your customer will be sent a notification when you save details on this page.",
            Save: "Save",
            Cancel: "Cancel",
            Back: "Back"
        }, fr: {
            OrderNumber: $sce.trustAsHtml("Order Number"),
            BackToOrders: $sce.trustAsHtml("Back to Orders"),
            ContractNumber: $sce.trustAsHtml("Contract number"),
            DeliveryDate: $sce.trustAsHtml("Delivery date"),
            DespatchDate: $sce.trustAsHtml("Date despatched"),
            InvoiceNum: $sce.trustAsHtml("Invoice Number"),
            NotificationText: $sce.trustAsHtml("Your customer will be sent a notification when you save details on this page."),
            Save: $sce.trustAsHtml("Save"),
            Cancel: $sce.trustAsHtml("Cancel"),
	        Back: "Back"
        }
    };
    function save(Order) {
		var orderStatus = vm.Order.xp.Status;
		var orderchange = false;
		//console.log(vm.Order.xp.ContractNumber +  "\n" + Order.xp.DeliveryDate +  "\n" + vm.Order.xp.DateDespatched +  "\n" + vm.Order.xp.InvoiceNumber);
        //if it has a despatch date- it is despatched. if it has an invoice it is in the final stage and is invoiced.
		var patch = {};
		patch.xp = {};
		if(updateOrderInfo.ContractNumber.classList.contains("ng-dirty")){
            patch.xp.ContractNumber = vm.Order.xp.ContractNumber;
		}
        if(vm.Order.xp.InvoiceNumber){
            patch.xp.Status = 'IV';
        }
        if(vm.Order.xp.DateDespatched && updateOrderInfo.DespatchDate.classList.contains("ng-dirty")){
            patch.xp.Status = 'DP';
            patch.xp.DateDespatched = vm.Order.xp.DateDespatched;
        }
        if(vm.Order.xp.DeliveryDate && updateOrderInfo.DeliveryDate.classList.contains("ng-dirty")){
            patch.xp.DeliveryDate = vm.Order.xp.DeliveryDate;
        }

		var direction = "Incoming";
		OrderCloudSDK.Orders.Patch(direction, Order.ID, patch)
			.then(function() {
				$rootScope.$broadcast('SwitchCart');
				$state.go($state.current,{}, {reload:true});
			})
			.catch(function(ex) {
				$exceptionHandler(ex);
			});
    }
    function cancel() {
        $state.go('order');
    }
    function backToOrders() {
        $state.go('ordersMain');
    }
    function openDespatched() {
		vm.popupDespatched.opened = true;
	}
	function openDelivery() {
		vm.popupDelivery.opened = true;
	}

    vm.labels = WeirService.LocaleResources(labels);
    vm.Save = save;
    vm.Cancel = cancel;
    vm.BackToOrders = backToOrders;
	vm.openDespatched = openDespatched;
	vm.openDelivery = openDelivery;

}
