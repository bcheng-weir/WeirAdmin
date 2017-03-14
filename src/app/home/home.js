angular.module('orderCloud')
	.config(HomeConfig)
	.controller('HomeCtrl', HomeController)
;

function HomeConfig($stateProvider) {
	$stateProvider
		.state('home', {
			parent: 'base',
			url: '/home',
			templateUrl: 'home/templates/home.tpl.html',
			controller: 'HomeCtrl',
			controllerAs: 'home',
            resolve: {
                Language: function(OrderCloud, $cookieStore, WeirService) {
                    OrderCloud.Me.Get()
	                    .then(function (buyer) {
	                        var lang = WeirService.Locale();
	                        //set the expiration date of the cookie.
	                        var now = new Date();
	                        var exp = new Date(now.getFullYear(), now.getMonth() + 6, now.getDate());
	                        if (buyer.xp.WeirGroup.id == 2 && lang == 'en') {
	                            //make it fr
	                            $cookieStore.put('language', 'fr', {
	                                expires: exp
	                            });

	                        }
	                        if (buyer.xp.WeirGroup.id == 1 && lang == 'fr') {
	                            //make it en
	                            $cookieStore.put('language', 'en', {
	                                expires: exp
	                            });

	                        }
                        });
                },
                IsAdmin: function (UserGroupsService) {
                    return UserGroupsService.IsUserInGroup([UserGroupsService.Groups.SuperAdmin]);
                },
                IsInternalSales: function (UserGroupsService) {
                    return UserGroupsService.IsUserInGroup([UserGroupsService.Groups.InternalSales]);
                }
            }
		});
}

function HomeController($sce, WeirService, IsAdmin, IsInternalSales) {
    var vm = this;
    vm.IsAdmin = IsAdmin;
    vm.CanEditCustomers = IsAdmin || IsInternalSales;

	var labels = {
		en: {
			Welcome: "Welcome to the sales administration area of<br>www.store.flowcontrol.weir",
			Orders: "Customer Quotes and Orders",
			SubmittedQuotes: "Quotes submitted for review",
			RevisedQuotes: "Revised Quotes",
			ConfirmedQuotes: "Confirmed Quotes",
			SubmittedOrders: "Orders submitted with PO",
			PendingOrders: "Orders submitted - pending PO",
			RevisedOrders: "Revised Orders",
			ConfirmedOrders: "Confirmed Orders",
			Despatched: "Despatched",
			Invoiced: "Invoiced",
			All: "All",
			Admin: "Admin",
			ManageAdmins: "Manage admins",
			StandardDelivery: "Carriage",
		    POPrintContent: "Fixed Print Content",
			Customers: "Customers",
			CustomerManage: "Manage customers and customer addresses",
			EnquiryQuotes: "Enquiries submitted"
		},
		fr: {
			Welcome: $sce.trustAsHtml("FR: Welcome to the sales administration area of<br>www.store.flowcontrol.weir"),
			Orders: $sce.trustAsHtml("FR: Customer Quotes and Orders"),
			SubmittedQuotes: $sce.trustAsHtml("FR: Quotes submitted for review"),
			RevisedQuotes: $sce.trustAsHtml("FR: Revised Quotes"),
			ConfirmedQuotes: $sce.trustAsHtml("FR: Confirmed Quotes"),
			SubmittedOrders: $sce.trustAsHtml("FR: Orders submitted with PO"),
			PendingOrders: $sce.trustAsHtml("FR: Orders submitted - pending PO"),
			RevisedOrders: $sce.trustAsHtml("FR: Revised Orders"),
			ConfirmedOrders: $sce.trustAsHtml("FR: Confirmed Orders"),
			Despatched: $sce.trustAsHtml("FR: Despatched"),
			Invoiced: $sce.trustAsHtml("FR: Invoiced"),
			All: $sce.trustAsHtml("FR: All"),
			Admin: $sce.trustAsHtml("FR: Admin"),
			ManageAdmins: $sce.trustAsHtml("FR: Manage admins"),
			StandardDelivery: "FR: Carriage",
			POPrintContent: "FR: Fixed Print Content",
			Customers: $sce.trustAsHtml("FR: Customers"),
			CustomerManage: $sce.trustAsHtml("FR: Manage customers and customer addresses"),
			EnquiryQuotes: $sce.trustAsHtml("FR: Enquiries submitted")
		}
	};
	vm.labels = labels[WeirService.Locale()];

	vm.OrderAction = _actions;
	function _actions(action) {
		var filter = {
			"ordersMain.quotesReview":{"xp.Type":"Quote","xp.Status":WeirService.OrderStatus.Submitted.id + "|" + WeirService.OrderStatus.Review.id, "xp.Active":true},
			"ordersMain.quotesRevised":{"xp.Type":"Quote","xp.Status":WeirService.OrderStatus.RevisedQuote.id + "|" + WeirService.OrderStatus.RejectedQuote.id, "xp.Active":true},
			"ordersMain.quotesConfirmed":{"xp.Type":"Quote","xp.Status":WeirService.OrderStatus.ConfirmedQuote.id, "xp.Active":true},
			"ordersMain.quotesEnquiry":{"xp.Type":"Quote","xp.Status":WeirService.OrderStatus.Enquiry.id + "|" + WeirService.OrderStatus.EnquiryReview.id, "xp.Active":true},
			"ordersMain.POOrders":{"xp.Type":"Order","xp.Status":WeirService.OrderStatus.SubmittedWithPO.id + "|" + WeirService.OrderStatus.Review.id, "xp.Active":true},
			"ordersMain.pendingPO":{"xp.Type":"Order","xp.PendingPO":true, "xp.Active":true},
			"ordersMain.ordersRevised":{"xp.Type":"Order","xp.Status":WeirService.OrderStatus.RevisedOrder.id + "|" + WeirService.OrderStatus.RejectedRevisedOrder.id, "xp.Active":true},
			"ordersMain.ordersConfirmed":{"xp.Type":"Order","xp.Status":WeirService.OrderStatus.ConfirmedOrder.id, "xp.Active":true},
			"ordersMain.ordersDespatched":{"xp.Type":"Order","xp.Status":WeirService.OrderStatus.Despatched.id, "xp.Active":true},
			"ordersMain.ordersInvoiced":{"xp.Type":"Order","xp.Status":WeirService.OrderStatus.Invoiced.id, "xp.Active":true},
			"ordersMain.ordersAll":{"xp.Type":"Order|Quote","xp.Active":true}
		};
		return JSON.stringify(filter[action]);
	}
}