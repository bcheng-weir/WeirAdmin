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
			controllerAs: 'home'
		});
}

function HomeController($sce, WeirService) {
	var vm = this;

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
			Customers: "Customers",
			CustomerManage: "Manage customers and customer addresses"
		},
		fr: {
			Welcome: $sce.trustAsHtml("Welcome to the sales administration area of<br>www.store.flowcontrol.weir"),
			Orders: $sce.trustAsHtml("Customer Quotes and Orders"),
			SubmittedQuotes: $sce.trustAsHtml("Quotes submitted for review"),
			RevisedQuotes: $sce.trustAsHtml("Revised Quotes"),
			ConfirmedQuotes: $sce.trustAsHtml("Confirmed Quotes"),
			SubmittedOrders: $sce.trustAsHtml("Orders submitted with PO"),
			PendingOrders: $sce.trustAsHtml("Orders submitted - pending PO"),
			RevisedOrders: $sce.trustAsHtml("Revised Orders"),
			ConfirmedOrders: $sce.trustAsHtml("Confirmed Orders"),
			Despatched: $sce.trustAsHtml("Despatched"),
			Invoiced: $sce.trustAsHtml("Invoiced"),
			All: $sce.trustAsHtml("All"),
			Admin: $sce.trustAsHtml("Admin"),
			ManageAdmins: $sce.trustAsHtml("Manage admins"),
			Customers: $sce.trustAsHtml("Customers"),
			CustomerManage: $sce.trustAsHtml("Manage customers and customer addresses")
		}
	};
	vm.labels = labels[WeirService.Locale()];

	vm.OrderAction = _actions;
	function _actions(action) {
		var filter = {
			"ordersMain.quotesReview":{"xp.Type":"Quote","xp.Status":WeirService.OrderStatus.Submitted.id + "|" + WeirService.OrderStatus.Review.id, "xp.Active":"true"},
			"ordersMain.quotesRevised":{"xp.Type":"Quote","xp.Status":WeirService.OrderStatus.RevisedQuote.id + "|" + WeirService.OrderStatus.RejectedQuote.id, "xp.Active":"true"},
			"ordersMain.quotesConfirmed":{"xp.Type":"Quote","xp.Status":WeirService.OrderStatus.ConfirmedQuote.id, "xp.Active":"true"},
			"ordersMain.POOrders":{"xp.Type":"Order","xp.Status":WeirService.OrderStatus.SubmittedWithPO.id + "|" + WeirService.OrderStatus.Review.id, "xp.Active":"true"},
			"ordersMain.pendingPO":{"xp.Type":"Order","xp.PendingPO":"true", "xp.Active":"true"},
			"ordersMain.ordersRevised":{"xp.Type":"Order","xp.Status":WeirService.OrderStatus.RevisedOrder.id, "xp.Active":"true"},
			"ordersMain.ordersConfirmed":{"xp.Type":"Order","xp.Status":WeirService.OrderStatus.ConfirmedOrder.id, "xp.Active":"true"},
			"ordersMain.ordersDespatched":{"xp.Type":"Order","xp.Status":WeirService.OrderStatus.Despatched.id, "xp.Active":"true"},
			"ordersMain.ordersInvoiced":{"xp.Type":"Order","xp.Status":WeirService.OrderStatus.Invoiced.id, "xp.Active":"true"},
			"ordersMain.ordersAll":{"xp.Type":"Order|Quote","xp.Active":"true"}
		};
		return JSON.stringify(filter[action]);
	}
}