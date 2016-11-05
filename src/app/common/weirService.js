angular.module( 'orderCloud' )
    .factory( 'WeirService', WeirService )
;

function WeirService( $q, $cookieStore, $sce, OrderCloud) {
    var orderStatuses = {
	    Draft: {id: "DR", label: "Draft", desc: "This is the current quote under construction"},
	    Saved: {id: "SV", label: "Saved", desc: "Quote has been saved but not yet submitted to weir as quote or order"},
	    Shared: {id: "SH", label: "Shared", desc: "Shopper quote has been shared with a buyer"},
	    Approved: {id: "AP", label: "Approved", desc: "Shopper quote has been shared with a buyer and approved"},
	    RevisedQuote: {id:"RQ", label:"Revised Quote", desc:"Weir have reviewed the quote and updated items as required. When the update is saved and ‘shared with the customer this becomes a ‘Revised quote’"},
        Rejected: {id: "RJ", label: "Rejected", desc: "Shopper quote has been shared with a buyer and then rejected"},
	    RejectedQuote: {id: "RJ", label: "Rejected Quote", desc: "Weir have shared Revised quote with buyer has rejected revision (this would display as a status in the list view of quotes rather than in the navigation)"},
        Submitted: {id: "SB", label: "Submitted", desc: "Customer has selected to request review OR review status is conditional based on POA items being included in quote"},
        SubmittedWithPO: {id: "SP", label: "Order submitted with PO", desc: "Order has been submitted to Weir with a PO"},
	    RevisedOrder: {id: "RO", label: "Revised Order", desc: "1. Weir have reviewed the order and updated items as required. When the update is saved and ‘shared with the customer this becomes a ‘Revised Order’."},
	    RejectedRevisedOrder: {id: "RR", label: "Rejected Revised Order", desc: "Weir have shared revised order and customer has rejected revision (this would display as a status in the list view of quotes rather than in the navigation)"},
        ConfirmedPending: {id: "CP", label: "Confirmed Quote", desc: "Quote has been submitted and confirmed by Weir, pending addition of PO number"},
        Review: {id: "RV", label: "Under review", desc: "Order has been submitted to Weir, but a change or additional information is needed"},
        Confirmed: {id: "CF", label: "Confirmed", desc: "Order has been submitted to and confirmed by Weir, and PO number is attached"},
	    ConfirmedOrder: {id: "CO", label: "Confirmed Order", desc: "1, Weir have reviewed order and confirmed all details are OK 2, Customer has accepted revised order"},
	    ConfirmedQuote: {id: "CQ", label: "Confirmed Quote", desc: "1. Customer has approved revised quote – assumes that if Weir have updated a revised quote the new /revised items are ‘pre-approved’ by Weir. 2. Weir admin has  confirmed a quote submitted for review by the customer."},
        Cancelled: {id: "CX", label: "Cancelled", desc: "Order cancelled after submission"},
        Despatched: {id: "DP", label: "Despatched", desc: "Order marked as despatched"},
        Invoiced: {id: "IV", label: "Invoiced", desc: "Order marked as invoiced"}
    };
    var orderStatusList = [
	    orderStatuses.Draft, orderStatuses.Saved, orderStatuses.Shared, orderStatuses.Approved, orderStatuses.RevisedQuote,
	    orderStatuses.Rejected, orderStatuses.RejectedQuote, orderStatuses.Submitted, orderStatuses.SubmittedWithPO,
	    orderStatuses.RevisedOrder, orderStatuses.RejectedRevisedOrder, orderStatuses.ConfirmedPending, orderStatuses.Review,
	    orderStatuses.Confirmed, orderStatuses.ConfirmedOrder, orderStatuses.ConfirmedQuote, orderStatuses.Cancelled,
	    orderStatuses.Despatched, orderStatuses.Invoiced
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

	function assignAddressToGroups(addressId) {
		var deferred = $q.defer();
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
			UserGroupID: "X6hpCL9v50GE_JG0tWD6vA",
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
				return deferred.reject(ex);
			});

		return deferred.promise;
	}

    var service = {
		OrderStatus: orderStatuses,
		OrderStatusList: orderStatusList,
		LookupStatus: getStatus,
	    AssignAddressToGroups: assignAddressToGroups

    };

    return service;
}
