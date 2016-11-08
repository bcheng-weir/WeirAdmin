angular.module( 'orderCloud' )
    .factory( 'WeirService', WeirService )
;

function WeirService($q, $cookieStore, $sce, OrderCloud, CurrentOrder) {
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
	    Invoiced: {id: "IV", label: "Invoiced", desc: "Order marked as invoiced"}
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
				d.deferred.reject(ex);
			});

		return deferred.promise;
	}

    var service = {
		OrderStatus: orderStatuses,
		OrderStatusList: orderStatusList,
		LookupStatus: getStatus,
	    AssignAddressToGroups: assignAddressToGroups,
		Locale: getLocale,
	    SetOrderAsCurrentOrder: setOrderAsCurrentOrder
    };

    return service;
}
