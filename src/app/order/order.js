angular.module('orderCloud')
    .service( 'OrderShareService', OrderShareService)
    .config(orderConfig)
    .controller('OrderCtrl',OrderController);

function OrderShareService() {
    var svc = {
        LineItems: [],
        Payments: [],
        Quote: null,
        Me: null
    };
    return svc;
}

function orderConfig($stateProvider, buyerid){
    $stateProvider.state('order', {
        parent: 'base',
        templateUrl: 'order/templates/order.tpl.html',
        controller: 'OrderCtrl',
        controllerAs: 'order',
        url: '/order',
        data: {componentName: 'order'},
        resolve: {
            Order: function(CurrentOrder){
                return CurrentOrder.Get();
            },
            DeliveryAddress: function (OrderCloud, Order) {
                if(Order.ShippingAddressID) {
                    return OrderCloud.Addresses.Get(Order.ShippingAddressID, buyerid);
                }
                else{
                    return null;
                }
            },
            LineItems: function ($q, $state, toastr, OrderCloud, CurrentOrder, OrderShareService, Order, LineItemHelpers) {
                OrderShareService.LineItems.length = 0;
	            var dfd = $q.defer();
	            CurrentOrder.GetID()
		            .then(function(id) {
			            OrderCloud.LineItems.List(Order.ID)
				            .then(function(data) {
					            if (!data.Items.length) {
						            toastr.error('Your quote does not contain any line items.', 'Error');
						            dfd.resolve({ Items: [] });
					            } else {
						            LineItemHelpers.GetProductInfo(data.Items)
							            .then(function () { dfd.resolve(data); });
					            }
				            })
		            })
		            .catch(function () {
		                toastr.error('Your quote does not contain any line items.', 'Error');
		                dfd.resolve({ Items: [] });
	                });
	            return dfd.promise;
            },
            Payments: function (Order, OrderCloud) {
                return OrderCloud.Payments.List(Order.ID);
            }
        }
    });
}
function OrderController($scope, $state, $sce, OrderCloud, Order, DeliveryAddress, LineItems, Payments, toastr, WeirService, Underscore, OrderToCsvService) {
    var vm = this;
    vm.Order = Order;
    vm.LineItems = LineItems;
    vm.DeliveryAddress = DeliveryAddress;
    vm.Status = Underscore.find(WeirService.OrderStatus, function(status) {
    	console.log(status);
        return status.id == vm.Order.xp.Status;
    });
    vm.Payments = Payments;
    var labels = {
        en: {
            //header labels
            status: "Status",
            OrderDate: "Order date;",
            Confirm: "Confirm",
            Revise: "Revise",
            ShareRevision: "Share revision",
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
            TagNum: "Tag number(if available)",
            PartNum: "Part Number",
            Description: "Description of Part",
            RecReplacement: "Recommended replacement",
            LeadTimeAvailability: "Lead time / Availability",
            PricePerItem: "PricePerItem",
            Quantity: "Quantity",
            Total: "Total",
            //labels to right of table
            Edit: "Edit",
            Removed: "Removed",
            Updated: "Updated",
            New: "New",
            //buttons above table
            BackToQuote: "Back to Quotes",
            AddNewItems: "Add new items",
            AddABlankItem: "Add a blank item",
            //footers
            YourRefNo: "Your Reference No;",
            DelieveryAddress: "Delivery Address",
            YourAttachments: "Your attachments",
            YourComments: "Your comments or instructions"
        },
        fr: {
            //header labels
            status:$sce.trustAsHtml( "Status"),
            OrderDate:$sce.trustAsHtml( "Order date;"),
            Confirm:$sce.trustAsHtml( "Confirm"),
            Revise:$sce.trustAsHtml( "Revise"),
            ShareRevision:$sce.trustAsHtml( "Share revision"),
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
            TagNum:$sce.trustAsHtml( "Tag number(if available)"),
            PartNum:$sce.trustAsHtml( "Part Number"),
            Description:$sce.trustAsHtml( "Description of Part"),
            RecReplacement:$sce.trustAsHtml( "Recommended replacement"),
            LeadTimeAvailability:$sce.trustAsHtml( "Lead time / Availability"),
            PricePerItem:$sce.trustAsHtml( "PricePerItem"),
            Quantity:$sce.trustAsHtml( "Quantity"),
            Total:$sce.trustAsHtml( "Total"),
            //labels to right of table
            Edit:$sce.trustAsHtml( "Edit"),
            Removed:$sce.trustAsHtml( "Removed"),
            Updated:$sce.trustAsHtml( "Updated"),
            New:$sce.trustAsHtml( "New"),
            //buttons above table
            BackToQuote:$sce.trustAsHtml( "Back to Quotes"),
            AddNewItems:$sce.trustAsHtml( "Add new items"),
            AddABlankItem:$sce.trustAsHtml( "Add a blank item"),
            //footers
            YourRefNo:$sce.trustAsHtml( "Your Reference No;"),
            DelieveryAddress:$sce.trustAsHtml("Delivery Address"),
            YourAttachments:$sce.trustAsHtml( "Your attachments"),
            YourComments:$sce.trustAsHtml( "Your comments or instructions")
        }
    };
    vm.labels = labels[WeirService.Locale()];
    function toCsv() {
        return OrderToCsvService.ToCsvJson(vm.Order, vm.LineItems, vm.DeliveryAddress, vm.Payments, vm.labels);
    }
    vm.ToCsvJson = toCsv;
    vm.CsvFilename = vm.Order.ID + ".csv";
}