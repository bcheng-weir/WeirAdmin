angular.module('orderCloud')
    .service('UserGroupsService', UserGroupsService)
    .factory( 'WeirService', WeirService )
;
function UserGroupsService($q, OrderCloud) {
    var groups = null;
    function _isUserInGroup(groupList) {
        var d = $q.defer();
        var isInGroup = false;
        if (!groups) {
            OrderCloud.Me.Get()
            .then(function(usr) {
                OrderCloud.AdminUserGroups.ListUserAssignments(null, usr.ID, 1, 50)
                .then(function (results) {
                    groups = [];
                    for (var i = 0; i < results.Items.length; i++) {
                        var id = results.Items[i].UserGroupID;
                        groups.push(id);
                        if (groupList.indexOf(id) > -1) isInGroup = true;
                    }
                    d.resolve(isInGroup);
                })
            })
        } else {
            for (var i = 0; i < groups.length; i++) {
                if (groupList.indexOf(groups[i]) > -1) isInGroup = true;
            }
            d.resolve(isInGroup);
        }
        return d.promise;
    }
    return {
        IsUserInGroup: _isUserInGroup,
        Groups: {
            SuperAdmin: 'SuperAdmin',
            InternalSales: 'InternalSales',
            ExternalSales: 'ExternalSales'
        }
    }
}

function WeirService($q, $cookieStore, $sce, OrderCloud, CurrentOrder, buyernetwork, buyerid) {
    var orderStatuses = {
	    Draft: {id: "DR", label: "Draft", desc: "This is the current quote under construction"},
	    Saved: {id: "SV", label: "Saved", desc: "Quote has been saved but not yet submitted to weir as quote or order"},
		Submitted: {id:"SB", label:"Quote Submitted for Review", desc:"Customer has selected to request review OR review status is conditional based on POA items being included in quote"},
	    RevisedQuote: {id:"RV", label:"Revised Quote", desc:"Weir have reviewed the quote and updated items as required. When the update is saved and ‘shared with the customer this becomes a ‘Revised quote’"},
	    RejectedQuote: {id: "RQ", label: "Rejected Quote", desc: "Weir have shared Revised quote with buyer has rejected revision (this would display as a status in the list view of quotes rather than in the navigation)"},
	    ConfirmedQuote: {id: "CQ", label: "Confirmed Quote", desc: "1. Customer has approved revised quote – assumes that if Weir have updated a revised quote the new /revised items are ‘pre-approved’ by Weir. 2. Weir admin has  confirmed a quote submitted for review by the customer."},
	    SubmittedWithPO: {id: "SP", label: "Order submitted with PO", desc: "Order has been submitted to Weir with a PO"},
	    SubmittedPendingPO: { id: "SE", label: "Order submitted pending PO", desc: "Order has been submitted to Weir with the expectation of a PO to be sent via email" },
	    RevisedOrder: { id: "RO", label: "Revised Order", desc: "1. Weir have reviewed the order and updated items as required. When the update is saved and ‘shared with the customer this becomes a ‘Revised Order’." },
	    RejectedRevisedOrder: {id: "RR", label: "Rejected Revised Order", desc: "Weir have shared revised order and customer has rejected revision (this would display as a status in the list view of quotes rather than in the navigation)"},
	    ConfirmedOrder: {id: "CO", label: "Confirmed Order", desc: "1, Weir have reviewed order and confirmed all details are OK 2, Customer has accepted revised order"},
	    Despatched: {id: "DP", label: "Despatched", desc: "Order marked as despatched"},
	    Invoiced: {id: "IV", label: "Invoiced", desc: "Order marked as invoiced"},
	    Review: {id: "RE", label: "Under review", desc: "Order or Quote has been submitted to Weir, but a change or additional information is needed"}
	    /*Shared: {id: "SH", label: "Shared", desc: "Shopper quote has been shared with a buyer"}, //Should this be an XP?
	    Approved: {id: "AP", label: "Approved", desc: "Shopper quote has been shared with a buyer and approved"},
        Rejected: {id: "RJ", label: "Rejected", desc: "Shopper quote has been shared with a buyer and then rejected"},
        Submitted: {id: "SB", label: "Submitted", desc: "Customer has selected to request review OR review status is conditional based on POA items being included in quote"},
        ConfirmedPending: {id: "CP", label: "Confirmed Quote", desc: "Quote has been submitted and confirmed by Weir, pending addition of PO number"},
        Review: {id: "RV", label: "Under review", desc: "Order has been submitted to Weir, but a change or additional information is needed"},
        Confirmed: {id: "CF", label: "Confirmed", desc: "Order has been submitted to and confirmed by Weir, and PO number is attached"},
        Cancelled: {id: "CX", label: "Cancelled", desc: "Order cancelled after submission"},*/
    };
    var orderStatusList = [
	    orderStatuses.Draft, orderStatuses.Saved, orderStatuses.Submitted, orderStatuses.RevisedQuote,
	    orderStatuses.RejectedQuote, orderStatuses.ConfirmedQuote, orderStatuses.SubmittedWithPO, orderStatuses.RevisedOrder,
	    orderStatuses.RejectedRevisedOrder, orderStatuses.ConfirmedOrder, orderStatuses.Despatched, orderStatuses.Invoiced,
        orderStatuses.SubmittedPendingPO, orderStatuses.Review
    ];
    // TODO - add localized label/description, include locale in selection
    function getStatus(id) {
		var match = null;
	        angular.forEach(orderStatusList, function(status) {
	            if (status.id == id) {
			    match = status;
			    return;
		    }
	        });
		return match;
    }

	function getLocale() {
		var localeOfUser = $cookieStore.get('language');
		if(localeOfUser == null || localeOfUser == false){
			//set the expiration date of the cookie.
			var now = new Date();
			var exp = new Date(now.getFullYear(), now.getMonth()+6, now.getDate());
			//getting the language of the user's browser
			localeOfUser = navigator.language;
			localeOfUser = localeOfUser.substr(0,2);
			//setting the cookie.
			$cookieStore.put('language', localeOfUser, {
				expires: exp
			});

		}
		return localeOfUser;
	}

	function assignAddressToGroups(addressId, buyerId) {
		var buyerAssignment = {
			AddressID: addressId,
			UserID: null,
			UserGroupID: "Buyers",
			IsShipping: true,
			IsBilling: true
		};
		var shopperAssignment = {
			AddressID: addressId,
			UserID: null,
			UserGroupID: "Shoppers",
			IsShipping: true,
			IsBilling: true
		};
		var adminAssignment = {
			AddressID: addressId,
			UserID: null,
			UserGroupID: "WeirAdmin",
			IsShipping: true,
			IsBilling: true
		};
		OrderCloud.Addresses.SaveAssignment(buyerAssignment, buyerId)
			.then(function() {
				return OrderCloud.Addresses.SaveAssignment(shopperAssignment, buyerId);
			})
			.then(function() {
				return OrderCloud.Addresses.SaveAssignment(adminAssignment, buyerId);
			})
			.catch(function(ex) {
				return ex
			});
	}

	function setOrderAsCurrentOrder(orderId) {
		var deferred = $q.defer();

		CurrentOrder.Set(orderId)
			.then(function() {
				return CurrentOrder.Get();
			})
			.then(function(order) {
				return CurrentOrder.SetCurrentCustomer({
					id: order.xp.CustomerID,
					name: order.xp.CustomerName
				});
			})
			.then(function() {
				deferred.resolve();
			})
			.catch(function(ex) {
				deferred.reject(ex);
			});

		return deferred.promise;
	}

	var lastSearchType = "";
	function setLastSearchType(type) {
		lastSearchType = type;
	}
	function getLastSearchType() {
		return lastSearchType;
	}

	function selectLocaleResources(resource) {
		var tmp = resource[getLocale()];
		return (tmp) ? tmp : resource["en"];
	}

	function findCart(customer) {
		var deferred = $q.defer();
		OrderCloud.Me.Get()
			.then(function(user) {
				var filter = {
					"FromUserId": user.ID,
					"xp.Type": "Quote",
					"xp.CustomerID": customer.id,
					"xp.Status": "DR"
				};
				OrderCloud.Me.ListOutgoingOrders(null, 1, 50, null, null, filter)
					.then(function(results) {
						if (results.Items.length > 0) {
							var ct = results.Items[0];
							CurrentOrder.Set(ct.ID);
							deferred.resolve(ct);
						} else {
							var cart = {
								"Type": "Standard",
								xp: {
									"Type": "Quote",
									"CustomerID": customer.id,
									"CustomerName": customer.name,
									"Status": "DR"
								}
							}
							OrderCloud.Orders.Create(cart)
								.then(function(ct) {
									CurrentOrder.Set(ct.ID);
									deferred.resolve(ct);
								})
								.catch(function(ex) {
									deferred.reject(ex);
								})
						}
					});
			})
			.catch(function(ex) {
				d.reject(ex);
			});
		return deferred.promise;
	}

    function serialNumber(serialNumber) {
        var deferred = $q.defer();
        var result;
	    var order = {};
        var impersonation = {
            ClientID: buyernetwork,
            Claims: []
        };
        var miniCartBuyer = {};
        CurrentOrder.Get()
            .then(function (co) {
                order = co;
                miniCartBuyer = {"FromUserID": co.FromUserID, "BuyerID": co.xp.BuyerID};
				return OrderCloud.Users.Get(co.FromUserID, co.xp.BuyerID)
            })
	        .then(function (buyer) {
	            // Get an access token for impersonation.
	            impersonation.Claims = buyer.AvailableRoles;
	            return OrderCloud.Users.GetAccessToken(miniCartBuyer.FromUserID, impersonation, miniCartBuyer.BuyerID);
            })
            .then(function (data) {
                // Set the local impersonation token so that As() can be used.
                OrderCloud.Auth.SetImpersonationToken(data['access_token']);
            }).then(function () {
				return OrderCloud.As().Me.ListCategories(null, 1, 50, "ParentID", null, {
                    "xp.SN": serialNumber,
                    "ParentID": order.xp.CustomerID
                    }, null, order.xp.CustomerID.substring(0, 5))
                .then(function (matches) {
                    if (matches.Items.length == 1) {
                        result = matches.Items[0];
                        getParts(result.ID, deferred, result);
                    } else if (matches.Items.length == 0) {
                        //throw { message: "No matches found for serial number " + serialNumber};
                        return deferred.resolve("No matches found for serial number " + serialNumber);
                    } else {
                        //throw { message: "Data error: Serial number " + serialNumber + " is not unique"};
                        return deferred.resolve("No matches found for serial number " + serialNumber);
                    }
                });
            })
            .then(function () {
                // Remove the impersonation token.
                return OrderCloud.Auth.RemoveImpersonationToken();
            });

        return deferred.promise;
    }

    function tagNumber(tagNumber) {
        var deferred = $q.defer();
        var result;
	    var order = {};
        var impersonation = {
            ClientID: buyernetwork,
            Claims: []
        };
        var miniCartBuyer = {};
        CurrentOrder.Get()
	        .then(function (co) {
	        	order = co;
	            miniCartBuyer = {"FromUserID": co.FromUserID, "BuyerID": co.xp.BuyerID};
	            return OrderCloud.Users.Get(co.FromUserID, co.xp.BuyerID)
            })
	        .then(function (buyer) {
	            // Get an access token for impersonation.
	            impersonation.Claims = buyer.AvailableRoles;
	            return OrderCloud.Users.GetAccessToken(miniCartBuyer.FromUserID, impersonation, miniCartBuyer.BuyerID);
            })
            .then(function (data) {
                // Set the local impersonation token so that As() can be used.
               return OrderCloud.Auth.SetImpersonationToken(data['access_token']);
            })
	        .then(function () {
	            return OrderCloud.As().Me.ListCategories(null, 1, 50, "ParentID", null, {
	                "xp.TagNumber": tagNumber,
	                "ParentID": order.xp.CustomerID
	            }, null, order.xp.CustomerID.substring(0, 5));
            })
            .then(function (matches) {
	            if (matches.Items.length > 0) {
		            angular.forEach(matches.Items, function (value, key) {
			            getParts(value.ID, deferred, value);
		            });
	            } else {
		            return deferred.resolve("No matches found for tag number " + tagNumber);
	            }
            })
            .then(function () {
                // Remove the impersonation token.
                return OrderCloud.Auth.RemoveImpersonationToken();
            })
            .catch(function (ex) {
                deferred.reject(ex);
            });
        return deferred.promise;
    }

    function getParts(catId, deferred, result) {
        var impersonation = {
            ClientID: buyernetwork,
            Claims: []
        };
        var order = {};
        var miniCartBuyer = {};
        CurrentOrder.Get()
	        .then(function (co) {
	        	order = co;
	            miniCartBuyer = {"FromUserID": co.FromUserID, "BuyerID": co.xp.BuyerID};
	            return OrderCloud.Users.Get(co.FromUserID, co.xp.BuyerID)
            })
	        .then(function (buyer) {
	            // Get an access token for impersonation.
	            impersonation.Claims = buyer.AvailableRoles;
	            return OrderCloud.Users.GetAccessToken(miniCartBuyer.FromUserID, impersonation, miniCartBuyer.BuyerID);
            })
            .then(function (data) {
                // Set the local impersonation token so that As() can be used.
                OrderCloud.Auth.SetImpersonationToken(data['access_token']);
            })
	        .then(function () {
                return OrderCloud.As().Me.ListProducts(null, 1, 100, null, null, null, catId, result.ParentID.substring(0, 5));
            })
            .then(function (products) {
                result.Parts = [];
                angular.forEach(products.Items, function (product) {
                    result.Parts.push({Number: product.ID, Detail: product});
                });
                deferred.resolve(result);
            })
            .then(function () {
                // Remove the impersonation token.
                return OrderCloud.Auth.RemoveImpersonationToken();
            })
			.catch(function (ex) {
                deferred.reject(ex);
        });
    }

    function serialNumbers(serialNumbers) {
        var deferred = $q.defer();
        var results = [];
        var queue = [];
        var impersonation = {
            ClientID: buyernetwork,
            Claims: []
        };
        var miniCartBuyer = {};
        var order = {};

        CurrentOrder.Get().then(function(co) {
	            order = co;
	            miniCartBuyer = {"FromUserID" : co.FromUserID, "BuyerID": co.xp.BuyerID };
	            return OrderCloud.Users.Get(co.FromUserID, co.xp.BuyerID)
	        }).then(function(buyer) {
	            // Get an access token for impersonation.
	            impersonation.Claims = buyer.AvailableRoles;
	            return OrderCloud.Users.GetAccessToken(miniCartBuyer.FromUserID, impersonation, miniCartBuyer.BuyerID);
	        })
            .then(function(data) {
                // Set the local impersonation token so that As() can be used.
                OrderCloud.Auth.SetImpersonationToken(data['access_token']);
            })
            .then(function(){
                    angular.forEach(serialNumbers, function(number) {
                        if (number) {
                            queue.push((function () {
                                var d = $q.defer();
                                return OrderCloud.As().Me.ListCategories(null, 1, 50, null, null, {"xp.SN": number, "ParentID":order.xp.CustomerID}, null, order.xp.CustomerID.substring(0,5))
                                    .then(function (matches) {
                                        if (matches.Items.length == 1) {
                                            results.push({Number: number, Detail: matches.Items[0]});
                                        } else {
                                            results.push({Number: number, Detail: null});
                                        }
                                        d.resolve();
                                    })
                                    .catch(function (ex) {
                                        results.push({Number: number, Detail: null});
                                        d.resolve();
                                    });
                                return d.promise;
                            })());
                        }
                    });
                    $q.all(queue)
                        .then(function() {
                            deferred.resolve(results);
                        });
            })
            .catch(function(ex) {
                d.resolve();
            });
        return deferred.promise;
    }

    function tagNumbers(tagNumbers) {
        var deferred = $q.defer();

        var results = [];
        var queue = [];
        var impersonation = {
            ClientID: buyernetwork,
            Claims: []
        };
        var miniCartBuyer = {};
        var order = {};
        CurrentOrder.Get()
	        .then(function(co) {
	            order = co;
	            miniCartBuyer = {"FromUserID" : co.FromUserID, "BuyerID": co.xp.BuyerID };
	            return OrderCloud.Users.Get(co.FromUserID, co.xp.BuyerID)
            })
	        .then(function(buyer) {
	            // Get an access token for impersonation.
	            impersonation.Claims = buyer.AvailableRoles;
	            return OrderCloud.Users.GetAccessToken(miniCartBuyer.FromUserID, impersonation, miniCartBuyer.BuyerID);
            })
            .then(function(data) {
                // Set the local impersonation token so that As() can be used.
                OrderCloud.Auth.SetImpersonationToken(data['access_token']);
            })
            .then(function(){
                    angular.forEach(tagNumbers, function(number) {
                        if (number) {
                            queue.push((function () {
                                var d = $q.defer();
                                return OrderCloud.As().Me.ListCategories(null, 1, 50, null, null, {
                                    "xp.TagNumber": number,
                                    "ParentID": order.xp.CustomerID
                                }, null, order.xp.CustomerID.substring(0, 5))
                                    .then(function (matches) {
                                        if (matches.Items.length == 1) {
                                            results.push({Number: number, Detail: matches.Items[0]});
                                        } else {
                                            results.push({Number: number, Detail: null});
                                        }
                                        d.resolve();
                                    })
                                    .catch(function (ex) {
                                        results.push({Number: number, Detail: null});
                                        d.resolve();
                                    });

                                return d.promise;
                            })());
                        }
                    });
                    $q.all(queue).then(function() {
                        deferred.resolve(results);
                    });
            })
            .catch(function(ex) {});

        return deferred.promise;
    }

	function partNumbers(partNumbers) {
		var results = {
			Parts: [],
			Customer: ""
		};
		var categories = [];
		var queue = [];
		var q2 = [];
		var q3 = [];
		var deferred = $q.defer();

		getParts(partNumbers);
		return $q.all(queue)
			.then(function() {
				getValvesForParts(results);
				$q.all(q2)
					.then(function() {
						getCustomerForValves(categories);
						$q.all(q3)
							.then(function() {
								deferred.resolve(results);
							});
					});
			})
			.catch (function(ex) {
				deferred.resolve(results);
			});
		return deferred.promise;

		function getParts(partNumbers) {
            var impersonation = {
                ClientID: buyernetwork,
                Claims: []
            };
            var order = {};
            angular.forEach(partNumbers, function (number) {
                if (number) {
                    var d = $q.defer();
                    queue.push((function () {
                        var miniCartBuyer = {};
                        CurrentOrder.Get()
	                        .then(function (co) {
	                        	order = co;
	                            miniCartBuyer = {"FromUserID": co.FromUserID, "BuyerID": co.xp.BuyerID};
	                            return OrderCloud.Users.Get(co.FromUserID, co.xp.BuyerID)
                            }).then(function (buyer) {
	                            // Get an access token for impersonation.
	                            impersonation.Claims = buyer.AvailableRoles;
	                            return OrderCloud.Users.GetAccessToken(miniCartBuyer.FromUserID, impersonation, miniCartBuyer.BuyerID);
                            })
                            .then(function (data) {
                                // Set the local impersonation token so that As() can be used.
                                OrderCloud.Auth.SetImpersonationToken(data['access_token']);
                            }).then(function () {
                            	//return OrderCloud.Products.List(number, 1, 50, null, null, null); //search, page, pageSize, searchOn, sortBy, filters
                                return OrderCloud.As().Me.ListProducts(null, 1, 50, null, null, {"Name": number+"*"}, null, miniCartBuyer.BuyerID.substring(0, 5))
                            })
                            .then(function (products) {
                                if (products.Items.length == 0) {
                                    results.Parts.push({Number: number, Detail: null});
                                } else {
                                    angular.forEach(products.Items, function (product) {
                                        var result = {Number: number, Detail: product};
                                        results.Parts.push(result);
                                    });
                                }
                                d.resolve();
                            })
                            .then(function () {
                                // Remove the impersonation token.
                                return OrderCloud.Auth.RemoveImpersonationToken();
                            })
                            .catch(function (ex) {
                                results.Parts.push({Number: number, Detail: null});
                                d.resolve();
                            });
                        return d.promise;
                    })());
                }
            })
        }

		function getValvesForParts(results) {
			angular.forEach(results.Parts, function(result) {
				if (result.Detail) {
					q2.push((function() {
						var d2 = $q.defer();
						var part = result.Detail;
						OrderCloud.Categories.ListProductAssignments(null, part.ID, 1, 50)
							.then(function(valveIds) {
								angular.forEach(valveIds.Items, function(entry) {
									if (categories.indexOf(entry) < 0) categories.push(entry);
								});
								d2.resolve();
							})
							.catch (function(ex) {
								d2.resolve();
							});
						return d2.promise;
					})());
				}
			});
		}

		function getCustomerForValves(valves) {
			var def3 = $q.defer();
			angular.forEach(valves, function(entry) {
				q3.push((function() {
					var d3 = $q.defer();
					OrderCloud.Categories.Get(entry.CategoryID)
						.then(function(item) {
							if (!results.Customer) {
								results.Customer = item.xp.Customer;
							} else if (results.Customer != item.xp.Customer) {
								results.Customer = "*";
							}
							d3.resolve();
						})
						.catch(function(ex) {
							d3.resolve();
						});
					return d3.promise;
				})());
			});
		}
	}

	function addPartToQuote(part) {
		var deferred = $q.defer();
		var currentOrder = {};

		CurrentOrder.Get()
			.then(function(order) {
				// order is the localforge order.
				currentOrder = order;
				return OrderCloud.LineItems.List(currentOrder.ID,null,null,null,null,null,null,currentOrder.xp.BuyerID);
			})
			.then(function(lineItems) {
				// If the line items contains the current part, then update.
				var elementPosition = lineItems.Items.map(function(x) {return x.ProductID;}).indexOf(part.Detail.ID);
				if(elementPosition == -1) {
					addLineItem(currentOrder);
				} else {
					updateLineItem(currentOrder, lineItems.Items[elementPosition]);
				}
			})
			.catch(function(ex) {
				$exceptionHandler(ex);
				// TODO are we starting orders from the admin app?
				/*OrderCloud.Orders.Create({ID: randomQuoteID()})
					.then(function(order) {
						CurrentOrder.Set(order.ID);
						addLineItem(order);
					})*/
			});

		function updateLineItem(order, lineItem) {
			// find the line item and update the quantity of the current order.
			var qty = part.Quantity + lineItem.Quantity;
			var li = {
				ProductID: lineItem.ProductID,
				Quantity: qty
			};
			OrderCloud.LineItems.Patch(order.ID, lineItem.ID, li, order.xp.BuyerID)
				.then(function(lineItem) {
					deferred.resolve({Order: order, LineItem: lineItem});
				})
		}

		function addLineItem(order) {
			// Impersonation is not getting the price added to the item as in the buyer app. Setting it manually in the admin app.
			var price = part && part.Detail && part.Detail.StandardPriceSchedule && part.Detail.StandardPriceSchedule.PriceBreaks && part.Detail.StandardPriceSchedule.PriceBreaks.length ? part.Detail.StandardPriceSchedule.PriceBreaks[0].Price : 0;
			var li = {
				ProductID: part.Detail.ID,
				Quantity: part.Quantity,
				UnitPrice: price,
				xp: {
					SN: part.xp.SN,
					TagNumber: part.xp.TagNumber
				}
			};

			var impersonation = {
				ClientID: buyernetwork,
				Claims: []
			};

			OrderCloud.Users.Get(order.FromUserID, order.xp.BuyerID)
				.then(function(buyer) {
					impersonation.Claims = buyer.AvailableRoles;
					return OrderCloud.Users.GetAccessToken(order.FromUserID, impersonation, order.xp.BuyerID);
				})
				.then(function(data) {
					return OrderCloud.Auth.SetImpersonationToken(data['access_token']);
				})
				.then(function() {
					return OrderCloud.As().LineItems.Create(order.ID, li, order.xp.BuyerID);
				})
				.then(function(lineItem) {
					deferred.resolve({Order: order, LineItem: lineItem});
				})
				.then(function() {
					return OrderCloud.Auth.RemoveImpersonationToken();
				})
				.catch(function(ex) {
					console.log(ex);
				});
		}

		return deferred.promise;
	}

	function addPartsToQuote(parts) {
		var deferred = $q.defer();

		CurrentOrder.Get()
			.then(function(order) {
				addLineItems(order);
			})
			.catch(function() {
				OrderCloud.Orders.Create({ID: randomQuoteID()})
					.then(function(order) {
						CurrentOrder.Set(order.ID);
						addLineItems(order);
					});
			});

		function addLineItems(order) {
			var queue = [];

			angular.forEach(parts, function(part) {
				if (part.Quantity) {
					queue.push((function() {
						var d = $q.defer();

						var li = {
							ProductID: part.Detail.ID,
							Quantity: part.Quantity
						};

						OrderCloud.LineItems.Create(order.ID, li, order.xp.BuyerID)
							.then(function(lineItem) {
								d.resolve(lineItem);
							});

						return d.promise;
					})());
				}
			});

			$q.all(queue).then(function() {
				deferred.resolve();
			});
		}

		return deferred.promise;
	}

	var service = {
		OrderStatus: orderStatuses,
		OrderStatusList: orderStatusList,
		LookupStatus: getStatus,
	    AssignAddressToGroups: assignAddressToGroups,
		Locale: getLocale,
	    SetOrderAsCurrentOrder: setOrderAsCurrentOrder,
	    SetLastSearchType: setLastSearchType,
	    GetLastSearchType: getLastSearchType,
	    LocaleResources: selectLocaleResources,
	    SearchType: { Serial: "s", Part: "p", Tag: "t"},
	    FindCart: findCart,
		SerialNumber: serialNumber,
		SerialNumbers: serialNumbers,
		PartNumbers: partNumbers,
		TagNumber: tagNumber,
		TagNumbers: tagNumbers,
		AddPartToQuote: addPartToQuote,
		AddPartsToQuote: addPartsToQuote
    };

    return service;
}