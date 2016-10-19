angular.module( 'orderCloud' )
    .factory( 'WeirService', WeirService )
;

function WeirService( $q, $cookieStore, $sce, OrderCloud) {
    var orderStatuses = {
	    Draft: {id: "DR", label: "Draft", desc: "This is the current quote under construction"},
	    Saved: {id: "SV", label: "Saved", desc: "Quote has been saved but not yet shared"},
	    Shared: {id: "SH", label: "Shared", desc: "Shopper quote has been shared with a buyer"},
	    Approved: {id: "AP", label: "Approved", desc: "Shopper quote has been shared with a buyer and approved"},
            Rejected: {id: "RJ", label: "Rejected", desc: "Shopper quote has been shared with a buyer and then rejected"},
            Submitted: {id: "SB", label: "Submitted", desc: "Quote has been submitted to Weir"},
            SubmittedWithPO: {id: "SP", label: "Order submitted with PO", desc: "Order has been submitted to Weir with a PO"},
            ConfirmedPending: {id: "CP", label: "Confirmed Quote", desc: "Quote has been submitted and confirmed by Weir, pending addition of PO number"},
            Review: {id: "RV", label: "Under review", desc: "Order has been submitted to Weir, but a change or additional information is needed"},
            Confirmed: {id: "CF", label: "Confirmed", desc: "Order has been submitted to and confirmed by Weir, and PO number is attached"},
            Cancelled: {id: "CX", label: "Cancelled", desc: "Order cancelled after submission"},
            Despatched: {id: "DP", label: "Despatched", desc: "Order marked as despatched"},
            Invoiced: {id: "IV", label: "Invoiced", desc: "Order marked as invoiced"}
    };
    var orderStatusList = [
	    orderStatuses.Draft, orderStatuses.Saved, orderStatuses.Shared, orderStatuses.Approved, orderStatuses.Rejected,
	    orderStatuses.Submitted, orderStatuses.ConfirmedPending, orderStatuses.SubmittedWithPO, orderStatuses.Review,
	    orderStatuses.Confirmed, orderStatuses.Cancelled, orderStatuses.Despatched, orderStatuses.Invoiced
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

    var service = {
	OrderStatus: orderStatuses,
	OrderStatusList: orderStatusList,
	LookupStatus: getStatus
    };

    return service;
}
