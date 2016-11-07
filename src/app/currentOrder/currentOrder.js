angular.module('orderCloud')
    .config(currentOrderConfig)
    .controller('CurrentOrderCtrl',CurrentOrderController);


function currentOrderConfig($stateProvider, buyerid){
    $stateProvider.state('currentOrder', {
        parent: 'base',
        templateUrl: 'currentOrder/templates/current.order.tpl.html',
        controller: 'CurrentOrderCtrl',
        controllerAs: 'order',
        url: '/currentOrder/:orderid',
        data: {componentName: 'currentOrder'},
        resolve: {
            Parameters: function($stateParams, OrderCloudParameters){
                return OrderCloudParameters.Get($stateParams);
            },
            Order: function (OrderCloud, Parameters) {
                return OrderCloud.Orders.Get(Parameters.orderid, buyerid);
            },
            DeliveryAddress: function (OrderCloud, Order) {
                return OrderCloud.Addresses.Get(Order.ShippingAddressID, buyerid);
            },
            LineItems: function(OrderCloud, Order){
                return OrderCloud.LineItems.List(Order.ID, null, null, null, null, null, null, buyerid);
            }
        }


    })
}

function CurrentOrderController($scope, $state, $sce, OrderCloud, Parameters, Order, DeliveryAddress, LineItems, toastr, WeirService){
        var vm = this;
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
                DelieveryAddress: "Delievery Address",
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
                DelieveryAddress:$sce.trustAsHtml("Delievery Address"),
                YourAttachments:$sce.trustAsHtml( "Your attachments"),
                YourComments:$sce.trustAsHtml( "Your comments or instructions")
            }
        };
        vm.labels = labels[WeirService.Locale()];


}

