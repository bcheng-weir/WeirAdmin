angular.module( 'orderCloud' )
    .factory( 'WeirService', WeirService )
;

function WeirService($q, $cookieStore, $sce, OrderCloud, CurrentOrder, buyerid) {
    var orderStatuses = {
	    Draft: {id: "DR", label: "Draft", desc: "This is the current quote under construction"},
	    Saved: {id: "SV", label: "Saved", desc: "Quote has been saved but not yet submitted to weir as quote or order"},
		Submitted: {id:"SB", label:"Quote Submitted for Review", desc:"Customer has selected to request review OR review status is conditional based on POA items being included in quote"},
	    RevisedQuote: {id:"RV", label:"Revised Quote", desc:"Weir have reviewed the quote and updated items as required. When the update is saved and ‘shared with the customer this becomes a ‘Revised quote’"},
	    RejectedQuote: {id: "RQ", label: "Rejected Quote", desc: "Weir have shared Revised quote with buyer has rejected revision (this would display as a status in the list view of quotes rather than in the navigation)"},
	    ConfirmedQuote: {id: "CQ", label: "Confirmed Quote", desc: "1. Customer has approved revised quote – assumes that if Weir have updated a revised quote the new /revised items are ‘pre-approved’ by Weir. 2. Weir admin has  confirmed a quote submitted for review by the customer."},
	    SubmittedWithPO: {id: "SP", label: "Order submitted with PO", desc: "Order has been submitted to Weir with a PO"},
	    RevisedOrder: {id: "RO", label: "Revised Order", desc: "1. Weir have reviewed the order and updated items as required. When the update is saved and ‘shared with the customer this becomes a ‘Revised Order’."},
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
	    orderStatuses.RejectedRevisedOrder, orderStatuses.ConfirmedOrder, orderStatuses.Despatched, orderStatuses.Invoiced
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

	function assignAddressToGroups(addressId) {
		var buyerAssignment = {
			AddressID: addressId,
			UserID: null,
			UserGroupID: "Buyer",
			IsShipping: true,
			IsBilling: true
		};
		var shopperAssignment = {
			AddressID: addressId,
			UserID: null,
			UserGroupID: "Shopper",
			IsShipping: true,
			IsBilling: true
		};
		var adminAssignment = {
			AddressID: addressId,
			UserID: null,
			UserGroupID: "Weir Admin",
			IsShipping: true,
			IsBilling: true
		};
		OrderCloud.Addresses.SaveAssignment(buyerAssignment)
			.then(function() {
				return OrderCloud.Addresses.SaveAssignment(shopperAssignment);
			})
			.then(function() {
				return OrderCloud.Addresses.SaveAssignment(adminAssignment);
			})
			.catch(function(ex) {
				return ex
			});
	}

	function setOrderAsCurrentOrder(quoteId) {
		var deferred = $q.defer();

		CurrentOrder.Set(quoteId)
			.then(function() {
				return CurrentOrder.Get();
			})
			.then(function(quote) {
				return CurrentOrder.SetCurrentCustomer({
					id: quote.xp.CustomerID,
					name: quote.xp.CustomerName
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

		CurrentOrder.GetCurrentCustomer()
			.then(function(cust) {
				if (cust) {
					//OrderCloud.Categories.List(null, 1, 50, null, null, {"xp.SN": serialNumber, "catalogID": cust.id})
					OrderCloud.Categories.List(null, null, null, null, null, {"xp.SN": serialNumber}, null, cust.id)
						.then(function(matches) {
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
				} else {
					throw { message: "Customer for search not set"};
				}
			})
			.catch(function(ex) {
				return deferred.reject(ex);
			});

		return deferred.promise;
	}

	function tagNumber(tagNumber) {
		var deferred = $q.defer();
		var result;
		CurrentOrder.GetCurrentCustomer()
			.then(function(cust) {
				if (cust) {
					OrderCloud.Categories.List(null, 1, 50, null, null, {"xp.TagNumber": tagNumber, "catalogID": cust.id})
						.then(function(matches) {
							if (matches.Items.length == 1) {
								result = matches.Items[0];
								getParts(result.ID, deferred, result);
							} else if (matches.Items.length == 0) {
								//throw { message: "No matches found for tag number " + tagNumber};
								return deferred.resolve("No matches found for tag number " + tagNumber);
							} else {
								//throw { message: "Data error: Tag number " + tagNumber + " is not unique"};
								return deferred.resolve("Data error: Tag number " + tagNumber + " is not unique");
							}
						});
				}
			})
			.catch(function(ex) {
				deferred.reject(ex);
			});
		return deferred.promise;
	}

	function getParts(catId, deferred, result) {
		//OrderCloud.Me.ListProducts(null, 1, 100, null, null, null, catId)
		OrderCloud.Products.List(null,null,null,null,null,null)
			.then(function(products) {
				result.Parts = [];
				angular.forEach(products.Items, function(product) {
					if(result.xp.Parts[product.ID]) {
						result.Parts.push({Number: product.ID, Detail: product});
					}
				});
				deferred.resolve(result);
			})
			.catch(function(ex) {
				deferred.reject(ex);
			})
	}

	function serialNumbers(serialNumbers) {
		var deferred = $q.defer();
		var results = [];
		var queue = [];
		CurrentOrder.GetCurrentCustomer()
			.then(function(cust) {
				if (cust) {
					angular.forEach(serialNumbers, function(number) {
						if (number) {
							queue.push((function() {
								var d = $q.defer();
								//OrderCloud.Categories.List(null, 1, 50, null, null, {"xp.SN": number, "catalogID": cust.id})
								OrderCloud.Categories.List(null, null, null, null, null, {"xp.SN": number}, 1, cust.id)
									.then(function(matches) {
										if (matches.Items.length == 1) {
											results.push({Number: number, Detail: matches.Items[0]});
										} else {
											results.push({Number: number, Detail: null});
										}
										d.resolve();
									})
									.catch(function(ex) {
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
				} else {
					deferred.resolve(results);
				}
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
		CurrentOrder.GetCurrentCustomer()
			.then(function(cust) {
				if (cust) {
					angular.forEach(tagNumbers, function(number) {
						if (number) {
							queue.push((function() {
								var d = $q.defer();
								OrderCloud.Categories.List(null, 1, 50, null, null, {"xp.TagNumber": number, "catalogID": cust.id})
									.then(function(matches) {
										if (matches.Items.length == 1) {
											results.push({Number: number, Detail: matches.Items[0]});
										} else {
											results.push({Number: number, Detail: null});
										}
										d.resolve();
									})
									.catch(function(ex) {
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
				} else {
					deferred.resolve(results);
				}
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
		$q.all(queue)
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
			angular.forEach(partNumbers, function(number) {
				if (number) {
					queue.push((function() {
						var d = $q.defer();

						OrderCloud.Me.ListProducts(null, 1, 50, null, null, {"Name": number})
							.then(function(products) {
								if (products.Items.length == 0) {
									results.Parts.push({Number: number, Detail: null});
								} else {
									angular.forEach(products.Items, function(product) {
										var result = {Number: number, Detail: product};
										results.Parts.push(result);
									});
								}
								d.resolve();
							})
							.catch(function(ex) {
								results.Parts.push({Number: number, Detail: null});
								d.resolve();
							});
						return d.promise;
					})());
				}
			});
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
				return OrderCloud.LineItems.List(currentOrder.ID,null,null,null,null,null,null, buyerid);
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
			.catch(function() {
				OrderCloud.Orders.Create({ID: randomQuoteID()})
					.then(function(order) {
						CurrentOrder.Set(order.ID);
						addLineItem(order);
					})
			});

		function updateLineItem(order, lineItem) {
			// find the line item and update the quantity of the current order.
			var qty = part.Quantity + lineItem.Quantity;
			var li = {
				ProductID: lineItem.ProductID,
				Quantity: qty
			}
			OrderCloud.LineItems.Patch(order.ID, lineItem.ID, li, buyerid)
				.then(function(lineItem) {
					deferred.resolve({Order: order, LineItem: lineItem});
				})
		}

		function addLineItem(order) {
			var li = {
				ProductID: part.Detail.ID,
				Quantity: part.Quantity,
				xp: {
					SN: part.xp.SN,
					TagNumber: part.xp.TagNumber
				}
			};

			OrderCloud.LineItems.Create(order.ID, li)
				.then(function(lineItem) {
					deferred.resolve({Order: order, LineItem: lineItem});
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

						OrderCloud.LineItems.Create(order.ID, li)
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
