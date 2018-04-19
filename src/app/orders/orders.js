angular.module('orderCloud')
	.service('OrdersSearchService',OrdersSearchService)
	.config(OrdersConfig)
	.controller('OrdersCtrl', OrdersController)
    .controller('RouteToOrderCtrl', RouteToOrderController)
;

function OrdersSearchService() {
	/*
	* I need to know:
	* 1. Buyer Name
	* 2. Quote or Order number
	* 3. Assigned to Me
	* 4. All of the usual filters
	*
	*/

	var CustomerName = null;
	var OrderNumber = null;
	var AssignedToMe = false;

	function getCustomerName() {
		return CustomerName;
	}

	function setCustomerName(v) {
		CustomerName = v;
	}

	function getOrderNumber() {
		return OrderNumber;
	}

	function setOrderNumber(v) {
		OrderNumber = v;
	}

	function getAssignedToMe() {
		return AssignedToMe;
	}

	function setAssignedToMe(v) {
		AssignedToMe = v;
	}

	function ApplyOpts(opts, Me) {
        if(getCustomerName()) {
            opts.filters["xp.CustomerName"] = getCustomerName();
        }

        if(getOrderNumber()) {
            opts.search = getOrderNumber();
            opts.searchOn = "ID";
        }

        if(getAssignedToMe()) {
            opts.filters["xp.ReviewerID"] = Me.ID;
        }

        return opts;
	}

	var service = {
        setCustomerName:setCustomerName,
        setOrderNumber:setOrderNumber,
        setAssignedToMe:setAssignedToMe,
        getCustomerName:getCustomerName,
        getOrderNumber:getOrderNumber,
        getAssignedToMe:getAssignedToMe,
		ApplyOpts:ApplyOpts
	};
	return service;
}

function OrdersConfig($stateProvider) {
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
                Quotes: function (OrderCloudSDK, Parameters, OrdersSearchService, Me) {
                    //On the default view only, i need to get the top 20 quotes, but even this view can be filtered.
                    Parameters.filters = Parameters.filters || {};
                    Parameters.filters.FromCompanyID = Me.xp.WeirGroup.label+'*';
                    var opts = {
                        sortBy: Parameters.sortBy,
                        page: 1,
                        pageSize: 20,
                        filters: angular.copy(Parameters.filters)
                    };
                    opts.filters["xp.Type"] = "Quote";
                    opts = OrdersSearchService.ApplyOpts(opts, Me);
                    return OrderCloudSDK.Orders.List("Incoming", opts);
                },
                Orders: function (OrderCloudSDK, Parameters, Me, CurrentBuyer, OrdersSearchService) {
                    //CurrentBuyer.SetBuyerID(undefined);
                    Parameters.filters = Parameters.filters || {};
                    var arrSearchOn = Parameters.searchOn;
                    if(arrSearchOn) {
                        var indexArr = arrSearchOn.indexOf("xp");
                        arrSearchOn = indexArr > -1 ? arrSearchOn.splice(index, 1) : arrSearchOn;
                    }

	                Parameters.filters.FromCompanyID = Me.xp.WeirGroup.label+'*';
                    var opts = {
                        from: Parameters.from,
                        to: Parameters.to,
                        search: Parameters.search,
                        searchOn: Parameters.searchOn,
                        sortBy: Parameters.sortBy,
                        page: Parameters.page,
                        pageSize: Parameters.pageSize || 20,
                        filters: angular.copy(Parameters.filters)
                    };
                    opts.filters["xp.Type"] = Parameters.filters["xp.Type"] ? Parameters.filters["xp.Type"] : "Order";
                    opts = OrdersSearchService.ApplyOpts(opts, Me);

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
		.state('ordersMain.default', {
			url:'/default',
			templateUrl:'orders/templates/order.default.tpl.html',
			parent:'ordersMain'
		})
        .state('ordersMain.ordersAll', {
            url: '/ordersAll',
            templateUrl: 'orders/templates/order.all.tpl.html',
            parent: 'ordersMain'
        })
        .state('ordersMain.quotesRequested', {
            url: '/quotesRequested',
            templateUrl: 'orders/templates/quote.requested.tpl.html',
            parent: 'ordersMain'
        })
        .state('ordersMain.quotesConfirmed', {
            url: '/quotesConfirmed',
            templateUrl: 'orders/templates/order.standard.tpl.html',
            parent: 'ordersMain'
        })
        .state('ordersMain.quotesDeleted', {
            url: '/quotesDeleted',
            templateUrl: 'orders/templates/order.standard.tpl.html',
            parent: 'ordersMain'
        })
        .state('ordersMain.ordersDraft', {
            url: '/ordersDraft',
            templateUrl: 'orders/templates/order.standard.tpl.html',
            parent: 'ordersMain'
        })
        .state('ordersMain.ordersConfirmed', {
            url: '/ordersConfirmed',
            templateUrl: 'orders/templates/order.standard.tpl.html',
            parent: 'ordersMain'
        })
        .state('ordersMain.ordersDeleted', {
            url: '/ordersDeleted',
            templateUrl: 'orders/templates/order.standard.tpl.html',
            parent: 'ordersMain'
        })
        .state('ordersMain.archived', {
            url: '/archived',
            templateUrl: 'orders/templates/order.standard.tpl.html',
            parent: 'ordersMain'
        });
}

function OrdersController($rootScope, $state, $sce, $ocMedia, $exceptionHandler, OrderCloudSDK, OrderCloudParameters,
						  Orders, Quotes, Parameters, buyerid, CurrentOrder, WeirService, CurrentBuyer, Languages,
						  Underscore, $uibModal, $document, Me, OrdersSearchService) {
	var vm = this;
	vm.SearchAssigned = OrdersSearchService.getAssignedToMe();

    vm.SearchCustomer = OrdersSearchService.getCustomerName() ? true : false; //This is the customer name search.
    vm.buyerSearch = OrdersSearchService.getCustomerName();

    vm.SearchOrder = OrdersSearchService.getOrderNumber() ? true : false; // This is the order number search.
    vm.orderSearch = OrdersSearchService.getOrderNumber();

	vm.xpType = Parameters.filters ? Parameters.filters["xp.Type"] : {};
	vm.StateName = $state.current.name;
	vm.list = Orders;
	vm.Quotes = Quotes;
	vm.parameters = Parameters;
	vm.sortSelection = Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;
	//Check if filters are applied
	vm.filtersApplied = vm.parameters.filters || vm.parameters.from || vm.parameters.to || ($ocMedia('max-width:767px') && vm.sortSelection); //Sort by is a filter on mobile devices
	vm.showFilters = vm.filtersApplied;
    vm.OrderCurrency = function (order) {
        return WeirService.CurrentCurrency(order).curr;
    };
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
			search:$sce.trustAsHtml("Search <i class='fa fa-search fa-3' aria-hidden='true'></i>"),
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
            dateDeleted: "Date Deleted",
            dateArchived: "Date Archived",
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
            deletedQuotes: "Deleted Quotes",
			ordersPendingPO: "Orders Submitted pending PO",
			ordersSubmittedPO: "Orders Submitted with PO",
			revisedOrders: "Revised Orders",
			confirmedOrders: "Confirmed Orders",
			despatched: "Despatched Orders",
            deletedOrders: "Deleted Orders",
			invoiced: "Invoiced Orders",
			allOrders: "All Orders",
            archived: "Archived Orders",
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
			Language: "Language",
			Currency: "Currency",
			validUntil: "Valid Until",
            OrdersAll: "All Quotes and Orders",
            QuotesRequested: "Quotes requested",
            QuotesConfirmed: "Confirmed quotes",
            QuotesDeleted: "Deleted quotes",
            OrdersDraft: "Draft orders",
            OrdersConfirmed: "Confirmed orders",
            OrdersDeleted: "Deleted orders",
            Dashboard: "Dashboard",
            Quotes: "Quotes",
            Orders: "Orders",
            Archived: "Archived",
			QuotesInProgress: "Quotes in progress",
			OrdersInProgress: "Orders in progress",
            DateUpdated: "Date Updated",
			QuoteNo: "Quote No.",
            OrderNo: "Order No.",
			CustomerRef: "Customer ref;",
			BusinessName: "Business name",
			Total: "Total"
		},
		fr: {
            search:$sce.trustAsHtml("Search <i class='fa fa-search fa-3' aria-hidden='true'></i>"),
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
            dateDeleted: $sce.trustAsHtml("Date Deleted"),
            dateArchived: $sce.trustAsHtml("Date Archived"),
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
            deletedQuotes: $sce.trustAsHtml("Deleted Quotes"),
			ordersPendingPO: $sce.trustAsHtml("Orders Submitted pending PO"),
			ordersSubmittedPO: $sce.trustAsHtml("Orders Submitted with PO"),
			revisedOrders: $sce.trustAsHtml("Revised Orders"),
			confirmedOrders: $sce.trustAsHtml("Confirmed Orders"),
			despatched: $sce.trustAsHtml("Despatched Orders"),
            deletedOrders: $sce.trustAsHtml("Deleted Orders"),
			invoiced: $sce.trustAsHtml("Invoiced Orders"),
			allOrders: $sce.trustAsHtml("All Orders"),
            archived: $sce.trustAsHtml("Archived Orders"),
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
            Language: $sce.trustAsHtml("Language"),
            Currency: $sce.trustAsHtml("Currency"),
            validUntil: $sce.trustAsHtml("Valid Until"),
            OrdersAll: "All Quotes and Orders",
            QuotesRequested: "Quotes requested",
            QuotesConfirmed: "Confirmed quotes",
            QuotesDeleted: "Deleted quotes",
            OrdersDraft: "Draft orders",
            OrdersConfirmed: "Confirmed orders",
            OrdersDeleted: "Deleted orders",
            Dashboard: "Dashboard",
            Quotes: "Quotes",
            Orders: "Orders",
            Archived: "Archived",
            QuotesInProgress: "Quotes in progress",
            OrdersInProgress: "Orders in progress",
            DateUpdated: "Date Updated",
            QuoteNo: "Quote No.",
			OrderNo: "Order No.",
            CustomerRef: "Customer ref;",
            BusinessName: "Business name",
            Total: "Total"
		}
	};
	vm.labels = labels.en;

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

    vm.archive = function (id) {
        var parentElem = angular.element($document[0].querySelector('body'));
        $uibModal.open({
            animation: true,
            size: 'md',
            templateUrl: 'orders/templates/archiveordermodal.tpl.html',
            controller: function ($uibModalInstance, $state, WeirService, toastr, $exceptionHandler) {
                var vm = this;
                vm.labels = {
                        ArchiveOrder: "Archive Quote / Order?",
                        ConfirmArchive: "Archive quote number " + id + "?",
                        CancelArchive: "Cancel",
                        ArchivedTitle: "Success",
                        ArchivedMessage: "Your order has been archived"
                };
                vm.close = function () {
                    $uibModalInstance.dismiss();
                };
                vm.archiveOrder = function () {
                    var mods = {
                        xp: {
                            Archive: true,
                            DateArchived: new Date()
                        }
                    };
                    OrderCloudSDK.Orders.Patch("Incoming", id, mods)
                        .then(function () {
                            $uibModalInstance.close();
                            toastr.success(vm.labels.ArchivedMessage, vm.labels.ArchivedTitle);
                            $state.go($state.current, {}, {
                                reload: true
                            });
                        })
                        .catch(function (ex) {
                            $exceptionHandler(ex);
                        });
                };
            },
            controllerAs: 'archiveModal',
            appendTo: parentElem
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

	function FilterActions(action) {
		var filter = {
			"ordersMain.default":{"xp.Type":null,"xp.Active":true,"xp.Archive":"!true"},
            "ordersMain.ordersAll":{"xp.Type":"Order|Quote","xp.Active":true,"xp.Archive":"!true"},
            "ordersMain.quotesRequested":{"xp.Type":"Quote","xp.Active":true,"xp.Archive":"!true","xp.Status":WeirService.OrderStatus.Enquiry.id + "|" + WeirService.OrderStatus.EnquiryReview.id + "|" + WeirService.OrderStatus.Submitted.id + "|" + WeirService.OrderStatus.RevisedQuote.id + "|" + WeirService.OrderStatus.RejectedQuote.id},
            "ordersMain.quotesConfirmed":{"xp.Type":"Quote","xp.Active":true,"xp.Archive":"!true","xp.Status":WeirService.OrderStatus.ConfirmedQuote.id},
            "ordersMain.quotesDeleted":{"xp.Type":"Quote","xp.Active":true,"xp.Archive":"!true","xp.Status":WeirService.OrderStatus.Deleted.id},
            "ordersMain.ordersDraft":{"xp.Type":"Order","xp.Active":true,"xp.Archive":"!true","xp.Status":WeirService.OrderStatus.SubmittedPendingPO.id + "|" + WeirService.OrderStatus.RevisedOrder.id + "|" + WeirService.OrderStatus.RejectedRevisedOrder.id},
            "ordersMain.ordersConfirmed":{"xp.Type":"Order","xp.Active":true,"xp.Archive":"!true","xp.Status":WeirService.OrderStatus.ConfirmedOrder.id + "|" + WeirService.OrderStatus.SubmittedWithPO.id + "|" + WeirService.OrderStatus.Despatched.id},
            "ordersMain.ordersDeleted":{"xp.Type":"Order","xp.Active":true,"xp.Archive":"!true","xp.Status":WeirService.OrderStatus.Deleted.id},
            "ordersMain.archived":{"xp.Type":"Order|Quote","xp.Active":true,"xp.Archive":true}
		};
		return filter[action];
	}

	vm.OrderNavigation = function(action) {
		var filter = FilterActions(action);
        return JSON.stringify(filter);
	};

	vm.SearchCustomerName = function(currentState) {
        vm.SearchCustomer = true;
        OrdersSearchService.setCustomerName(vm.buyerSearch);
		var filter = FilterActions(currentState);
        $state.go($state.current, {filters:JSON.stringify(filter)}, {reload:true});
	};

	vm.ClearCustomerName = function(currentState) {
        vm.SearchCustomer = false;
        OrdersSearchService.setCustomerName(null);
        var filter = FilterActions(currentState);
        $state.go($state.current, {filters:JSON.stringify(filter)}, {reload:true});
	};

    vm.SearchOrderID = function(currentState) {
        vm.SearchOrder = true;
        OrdersSearchService.setOrderNumber(vm.orderSearch);
        var filter = FilterActions(currentState);
        $state.go($state.current, {filters:JSON.stringify(filter)}, {reload:true});
    };

    vm.ClearOrderID = function(currentState) {
        vm.SearchOrder = false;
        OrdersSearchService.setOrderNumber(null);
        var filter = FilterActions(currentState);
        $state.go($state.current, {filters:JSON.stringify(filter)}, {reload:true});
    };

    vm.ShowAssignedOrders = function(currentState) {
        vm.SearchAssigned = true;
        OrdersSearchService.setAssignedToMe(true);
        var filter = FilterActions(currentState);
        $state.go($state.current, {filters:JSON.stringify(filter)}, {reload:true});
    };

    vm.ClearAssignedOrders = function(currentState) {
        vm.SearchAssigned = false;
        OrdersSearchService.setAssignedToMe(false);
        var filter = FilterActions(currentState);
        $state.go($state.current, {filters:JSON.stringify(filter)}, {reload:true});
    };
}

function RouteToOrderController($rootScope, $state, OrderCloudSDK, CurrentOrder, CurrentBuyer, toastr, Order, $exceptionHandler) {
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
			    });
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
