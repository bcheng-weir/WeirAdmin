angular.module('orderCloud')
	.config(OrdersConfig)
	.controller('OrdersCtrl', OrdersController)
    .controller('RouteToOrderCtrl', RouteToOrderController)
;

function OrdersConfig($stateProvider, buyerid) {
    $stateProvider
        .state('ordersMain', {
            parent: 'base',
            templateUrl: 'orders/templates/orders.tpl.html',
            controller: 'OrdersCtrl',
            controllerAs: 'orders',
            url: '/orders?from&to&search&page&pageSize&searchOn&sortBy&sortByXp&filters&buyerid',
            data: { componentName: 'Orders' },
            resolve: {
            	Me: function(OrderCloudSDK) {
            	    return OrderCloudSDK.Me.Get();
	            },
                Parameters: function ($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                Orders: function (OrderCloudSDK, Parameters, Me, CurrentBuyer) {
                    CurrentBuyer.SetBuyerID(undefined);
                    var arrSearchOn = Parameters.searchOn;
                    if(arrSearchOn) {
                        var indexArr = arrSearchOn.indexOf("xp");
                        arrSearchOn = indexArr > -1 ? arrSearchOn.splice(index, 1) : arrSearchOn;
                    }
                    Parameters.searchOn = (Parameters.search) ? (Parameters.searchOn ? arrSearchOn : "ID") : null; //  "ID,FromUserID,Total";
	                Parameters.filters["FromCompanyID"] = Me.xp.WeirGroup.label+'*';
                    var opts = {
                        from: Parameters.from,
                        to: Parameters.to,
                        search: Parameters.search,
                        searchOn: Parameters.searchOn,
                        sortBy: Parameters.sortBy,
                        page: Parameters.page,
                        pageSize: Parameters.pageSize || 20,
                        filters: Parameters.filters
                    };
                    return OrderCloudSDK.Orders.List("Incoming", opts);
                },
				Languages: function (OrderCloudSDK, Orders) {
            		var filter;
            		angular.forEach(Orders.Items, function(value,key) {
            			if (filter) {
            				filter = filter + "|" + value.FromCompanyID;
						} else {
            				filter = value.FromCompanyID;
						}
					});

            		var opts = {
            			filters: {
            				ID: filter
						}
					};

            		return OrderCloudSDK.Buyers.List(opts);
				}
            }
        })
		.state('ordersMain.quotesRevised', {
		    url: '/quotesRevised',
		    templateUrl: 'orders/templates/quote.revised.tpl.html',
		    parent: 'ordersMain'
		})
		.state('ordersMain.quotesReview', {
		    url: '/quotesReview',
		    templateUrl: 'orders/templates/quote.review.tpl.html',
		    parent: 'ordersMain'
		})
		.state('ordersMain.quotesConfirmed', {
		    url: '/quotesConfirmed',
		    templateUrl: 'orders/templates/quote.confirm.tpl.html',
		    parent: 'ordersMain'
		})
	    .state('ordersMain.quotesEnquiry', {
	    	url: '/quotesEnquiry',
		    templateUrl: 'orders/templates/quote.enquiry.tpl.html',
		    parent: 'ordersMain'
	    })
		.state('ordersMain.ordersRevised', {
		    url: '/ordersRevised',
		    templateUrl: 'orders/templates/order.revised.tpl.html',
		    parent: 'ordersMain'
		})
		.state('ordersMain.POOrders', {
		    url: '/ordersSubmitted',
		    templateUrl: 'orders/templates/order.submitted.tpl.html',
		    parent: 'ordersMain'
		})
		.state('ordersMain.pendingPO', {
		    url: '/PendingPO',
		    templateUrl: 'orders/templates/order.pending.tpl.html',
		    parent: 'ordersMain'
		})
		.state('ordersMain.ordersConfirmed', {
		    url: '/orderConfirmed',
		    templateUrl: 'orders/templates/order.confirmed.tpl.html',
		    parent: 'ordersMain'
		})
		.state('ordersMain.ordersDespatched', {
		    url: '/orderDespatched',
		    templateUrl: 'orders/templates/order.despatched.tpl.html',
		    parent: 'ordersMain'
		})
		.state('ordersMain.ordersInvoiced', {
		    url: '/quotesReview',
		    templateUrl: 'orders/templates/order.invoiced.tpl.html',
		    parent: 'ordersMain'
		})
        .state('ordersMain.listOfRevisions', {
            url: '/listOfRevisions',
            templateUrl: 'orders/templates/order.revisions.tpl.html',
            parent: 'ordersMain'
        })
		.state('ordersMain.ordersAll', {
		    url: '/ordersAll',
		    templateUrl: 'orders/templates/order.all.tpl.html',
		    parent: 'ordersMain'
		})
    	.state('gotoOrder', {
    	    url: '/orders/:buyerID/:orderID',
    	    controller: 'RouteToOrderCtrl',
    	    resolve: {
    	        Order: function ($q, appname, $localForage, $stateParams, OrderCloudSDK, toastr, $state, $exceptionHandler) {
    	            var d = $q.defer();
    	            var storageName = appname + '.routeto';
    	            $localForage.setItem(storageName, { state: 'gotoOrder', id: $stateParams.orderID, buyer: $stateParams.buyerID })
	                    .then(function () {
	                        OrderCloudSDK.Orders.Get("Incoming", $stateParams.orderID)
		                        .then(function (order) {
		                            $localForage.removeItem(storageName);
		                            d.resolve(order);
		                        })
		                        .catch(function (ex) {
		                            if (ex.status == 404) {
		                                $localForage.removeItem(storageName);
		                                toastr.error("Order not found");
		                                $state.go('home');
		                            }
		                        });
	                    });
    	            return d.promise;
    	        }
    	    }
    	})
    ;
}

function OrdersController($rootScope, $state, $sce, $ocMedia, $exceptionHandler, OrderCloudSDK, OrderCloudParameters, Orders, Parameters, buyerid, CurrentOrder, WeirService, CurrentBuyer, Languages, Underscore) {
	var vm = this;
	vm.xpType = Parameters.filters ? Parameters.filters["xp.Type"] : {};
	vm.StateName = $state.current.name;
	/*Orders.Items = Underscore.filter(Orders.Items, function(item) {
		if(item.xp && item.xp.BuyerID && Me.xp && Me.xp.WeirGroup) {
			return item.xp.BuyerID.indexOf(Me.xp.WeirGroup.label) > -1;
		}
	});*/
	vm.list = Orders;
	vm.parameters = Parameters;
	vm.sortSelection = Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;
	//Check if filters are applied
	vm.filtersApplied = vm.parameters.filters || vm.parameters.from || vm.parameters.to || ($ocMedia('max-width:767px') && vm.sortSelection); //Sort by is a filter on mobile devices
	vm.showFilters = vm.filtersApplied;
	vm.getLanguage = function(customer) { //Given a customer ID, return their language.
		var buyer = Underscore.findWhere(Languages.Items, {"ID": customer});

		buyer.xp = buyer.xp || {};
		buyer.xp.Lang = buyer.xp.Lang || {};
        buyer.xp.Lang.id = buyer.xp.Lang.id || "";

		return buyer.xp.Lang.id.toUpperCase();
	};

	//For status label styling.
    vm.getStatusLabel = function(id) {
        var status = WeirService.LookupStatus(id);
        if (status) {
            return status.label;
        }
    };

	//Check if search was used
	vm.searchResults = Parameters.search && Parameters.search.length > 0;

	//Reload the state with new parameters
	vm.filter = function(resetPage) {
		$state.go('.', OrderCloudParameters.Create(vm.parameters, resetPage));
	};

	vm.dateOf = function(utcDate) {
		return new Date(utcDate);
	};

	//Reload the state with new search parameter & reset the page
	vm.search = function() {
		vm.parameters.searchOn = '';
		vm.filter(true);
	};

	//Clear the search parameter, reload the state & reset the page
	vm.clearSearch = function() {
		vm.parameters.search = null;
		vm.filter(true);
	};

	//Clear relevant filters, reload the state & reset the page
	vm.clearFilters = function() {
		vm.parameters.filters = null;
		vm.parameters.from = null;
		vm.parameters.to = null;
		$ocMedia('max-width:767px') ? vm.parameters.sortBy = null : angular.noop(); //Clear out sort by on mobile devices
		vm.filter(true);
	};

	//Conditionally set, reverse, remove the sortBy parameter & reload the state
	vm.updateSort = function(value) {
		value ? angular.noop() : value = vm.sortSelection;
		switch(vm.parameters.sortBy) {
			case value:
				vm.parameters.sortBy = '!' + value;
				break;
			case '!' + value:
				vm.parameters.sortBy = null;
				break;
			default:
				vm.parameters.sortBy = value;
		}
		vm.filter(false);
	};

	//Used on mobile devices
	vm.reverseSort = function() {
		Parameters.sortBy.indexOf('!') == 0 ? vm.parameters.sortBy = Parameters.sortBy.split('!')[1] : vm.parameters.sortBy = '!' + Parameters.sortBy;
		vm.filter(false);
	};

	//Reload the state with the incremented page parameter
	vm.pageChanged = function() {
		$state.go('.', {page:vm.list.Meta.Page});
	};

	//Load the next page of results with all of the same parameters
	vm.loadMore = function() {
            var opts = {
                search: Parameters.search,
                searchOn: Parameters.searchOn,
                sortBy: Parameters.sortBy,
                page: vm.list.Meta.Page + 1,
                pageSize: Parameters.pageSize || vm.list.Meta.PageSize,
                filters: Parameters.filters,
                buyerID: buyerid
            };
		return OrderCloudSDK.Orders.List("Incoming", opts)
			.then(function(data) {
				vm.list.Items = vm.list.Items.concat(data.Items);
				vm.list.Meta = data.Meta;
			});
	};

	var labels = {
		en: {
			search:"Search",
			Quote: "Quote ID",
			Order: "Order ID",
			customerRef: "Customer Ref",
			businessName: "Business Name",
			submittedBy: "Submitted By",
			quoteValue: "Quote Value",
			dateSubmitted: "Submitted Date",
			dateUpdated: "Date Updated",
			statusDate: "Status Date",
			dateRevised: "Date Revised",
			reviewer: "Reviewer",
			view: "View",
			update: "Update",
			revisions: "Revisions",
			status: "Status",
			loadMore:"Load More",
			poNumber:"PO Number",
			orderedBy:"Ordered By",
			contractNo: "Contract number",
			dateOrdered: "Order date",
			dateConfirmed: "Date confirmed",
			confirmedBy: "Confirmed by",
			estimatedDelivery: "Estimated delivery date",
			dateDespatched: "Estimated delivery date",
			orderValue: "Order value",
			invoiceValue: "Invoice Number",
			SearchPlaceholder: "Search " + vm.xpType + "s...",
			quotesForReview: "Quotes Submitted for Review",
			revisedQuotes: "Revised Quotes",
			confirmedQuotes: "Confirmed Quotes",
			ordersPendingPO: "Orders Submitted pending PO",
			ordersSubmittedPO: "Orders Submitted with PO",
			revisedOrders: "Revised Orders",
			confirmedOrders: "Confirmed Orders",
			despatched: "Despatched Orders",
			invoiced: "Invoiced Orders",
			allOrders: "All Orders",
			viewQuote: "Select ‘view’ to review quote and revise or confirm the quote",
			viewOrder: "Select ‘view’ to review order and to revise or confirm order",
			viewQuoteRevisions: "Select ‘revisions’ to view list of quote revisions",
			viewOrderRevisions: "Select ‘revisions’ to view list of order revisions",
			revisionsList: vm.xpType + " revisions for " + vm.xpType + "; " + Parameters.filters["xp.OriginalOrderID"],
			selectRevision:"Select ‘view’ to view previous revisions for reference",
			viewRevision: "You can view and update the current revision",
			StatusRV: "Status RV = Revised Quote",
			StatusRO: "Status RO = Revised Order",
			StatusRR: "Status RR = Rejected Revised Order",
			StatusRQ: "Status RQ = Rejected Quote",
			StatusEN: "Status EN = Enquiry Submitted",
			StatusER: "Status ER = Enquiry Under Review",
			enquiriesSubmitted: "Enquiries submitted",
			Language: "Language"
		},
		fr: {
			search:$sce.trustAsHtml("Search"),
			Quote: $sce.trustAsHtml("Quote ID"),
			Order: $sce.trustAsHtml("Order ID"),
			customerRef: $sce.trustAsHtml("Customer Ref"),
			businessName: $sce.trustAsHtml("Business Name"),
			submittedBy: $sce.trustAsHtml("Submitted By"),
			quoteValue: $sce.trustAsHtml("Quote Value"),
            dateSubmitted: $sce.trustAsHtml("Submitted Date"),
            dateUpdated: $sce.trustAsHtml("Date Updated"),
            statusDate: $sce.trustAsHtml("Status Date"),
			dateRevised: $sce.trustAsHtml("Date Revised"),
			reviewer: $sce.trustAsHtml("Reviewer"),
			view: $sce.trustAsHtml("View"),
			revisions: $sce.trustAsHtml("Revisions"),
			status: $sce.trustAsHtml("Status"),
			loadMore:$sce.trustAsHtml("Load More"),
			poNumber:$sce.trustAsHtml("PO Number"),
			orderedBy:$sce.trustAsHtml("Ordered By"),
			SearchPlaceholder: $sce.trustAsHtml("Search " + vm.xpType + "s..."),
			quotesForReview: $sce.trustAsHtml("Quotes Submitted for Review"),
			revisedQuotes: $sce.trustAsHtml("Revised Quotes"),
			confirmedQuotes: $sce.trustAsHtml("Confirmed Quotes"),
			ordersPendingPO: $sce.trustAsHtml("Orders Submitted pending PO"),
			ordersSubmittedPO: $sce.trustAsHtml("Orders Submitted with PO"),
			revisedOrders: $sce.trustAsHtml("Revised Orders"),
			confirmedOrders: $sce.trustAsHtml("Confirmed Orders"),
			despatched: $sce.trustAsHtml("Despatched Orders"),
			invoiced: $sce.trustAsHtml("Invoiced Orders"),
			allOrders: $sce.trustAsHtml("All Orders"),
			viewQuote: $sce.trustAsHtml("Select ‘view’ to review quote and revise or confirm the quote"),
			viewOrder: $sce.trustAsHtml("Select ‘view’ to review order and to revise or confirm order"),
			viewQuoteRevision: $sce.trustAsHtml("Select ‘revisions’ to view list of quote revisions"),
			viewOrderRevision: $sce.trustAsHtml("Select ‘revisions’ to view list of order revisions"),
			revisionsList: $sce.trustAsHtml(vm.xpType + " revisions for " + vm.xpType + "; " + Parameters.filters["xp.OriginalOrderID"]),
			selectRevision:$sce.trustAsHtml("Select ‘view’ to view previous revisions for reference"),
			viewRevision: $sce.trustAsHtml("You can view and update the current revision"),
			StatusRV: $sce.trustAsHtml("Status RV = Revised Quote"),
			StatusRO: $sce.trustAsHtml("Status RO = Revised Order"),
			StatusRR: $sce.trustAsHtml("Status RR = Rejected Revised Order"),
			StatusRQ: $sce.trustAsHtml("Status RQ = Rejected Quote"),
			StatusEN: $sce.trustAsHtml("Status EN = Enquiry Submitted"),
			StatusER: $sce.trustAsHtml("Status ER = Enquiry Under Review"),
			enquiriesSubmitted: $sce.trustAsHtml("Enquiries submitted"),
            Language: $sce.trustAsHtml("Language")
		}
	};
	vm.labels = labels.en;

	vm.titles = {
		"ordersMain.quotesReview":"quotesForReview",
		"ordersMain.quotesRevised":"revisedQuotes",
		"ordersMain.quotesConfirmed":"confirmedQuotes",
		"ordersMain.quotesEnquiry":"enquiriesSubmitted",
		"ordersMain.POOrders":"ordersSubmittedPO",
		"ordersMain.pendingPO":"ordersPendingPO",
		"ordersMain.ordersRevised":"revisedOrders",
		"ordersMain.ordersConfirmed":"confirmedOrders",
		"ordersMain.ordersDespatched":"despatched",
		"ordersMain.ordersInvoiced":"invoiced",
		"ordersMain.ordersAll":"allOrders",
		"ordersMain.listOfRevisions":"revisionsList"
	};

	vm.View = function(orderId, buyerId, customerId, customerName) {
		CurrentBuyer.SetBuyerID(buyerId);
		CurrentOrder.Set(orderId)
			.then(function() {
				return OrderCloudSDK.Buyers.Get(customerId);
			}).then(function(customerRecord) {
				var lang = "";
				if (customerRecord.xp && customerRecord.xp.Lang && customerRecord.xp.Lang.id) {
					lang = customerRecord.xp.Lang.id;
				}
				CurrentOrder.SetCurrentCustomer({
					id: customerId,
					name: customerName,
					lang: lang
				});
			})
			.then(function() {
				$rootScope.$broadcast('SwitchCart');
				$state.go('order');
			})
			.catch(function(ex) {
				$exceptionHandler(ex);
			});
	};

	vm.Revisions = function(orderid, orderType) {
		var filter = {
			"xp.Type":orderType,
			"xp.OriginalOrderID": orderid
		};
        $state.go("ordersMain.listOfRevisions", {filters:JSON.stringify(filter)},{reload:true});
	};

	vm.Update = function(orderId, buyerId) {
		CurrentBuyer.SetBuyerID(buyerId);
		WeirService.SetOrderAsCurrentOrder(orderId)
			.then(function(){
				$rootScope.$broadcast('SwitchCart');
				$state.go('order.addinfo');
			})
				.catch(function(ex){
				$exceptionHandler(ex);
		});
	};
}

function RouteToOrderController($rootScope, $state, OrderCloudSDK, CurrentOrder, CurrentBuyer,  toastr, Order, $exceptionHandler) {
    if (Order) {
            reviewOrder(Order.ID, Order.xp.Status, Order.xp.BuyerID, Order.xp.CustomerID, Order.xp.CustomerName);
    } else {
        toastr.error("Order not found");
        $state.go('ordersMain.ordersAll');
    }
    function reviewOrder(orderId, status, buyerId, customerId, customerName) {
        CurrentBuyer.SetBuyerID(buyerId);
        CurrentOrder.Set(orderId)
			.then(function () {
			    CurrentOrder.SetCurrentCustomer({
			        id: customerId,
			        name: customerName
			    })
			})
			.then(function () {
			    $rootScope.$broadcast('SwitchCart');
			    $state.go('order');
			})
			.catch(function (ex) {
			    $exceptionHandler(ex);
			});
    }
}
