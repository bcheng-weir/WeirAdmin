angular.module('orderCloud')
    .config(currentOrderConfig)
    .controller('CurrentOrderCtrl',CurrentOrderController);


function currentOrderConfig($stateProvider, buyerid){
    $stateProvider.state('currentOrder', {
        parent: 'base',
        templateUrl: 'currentOrder/template/current.order.tpl.html',
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
                return OrderCloud.Address.Get(Order.ShippingAddressID, buyerid);
            },
            LineItems: function(OrderCloud, Order){
                return OrderCloud.LineItems.Get(Order.ID, null, null, null, null, null, null, buyerid);
            }
        }


    })
}

function CurrentOrderController($scope, $state, $sce, OrderCloud, Parameters, Order, DelieveryAddress, LineItems, toastr, WeirService){
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
                status:$sce.trustasHtml( "Status"),
                OrderDate:$sce.trustasHtml( "Order date;"),
                Confirm:$sce.trustasHtml( "Confirm"),
                Revise:$sce.trustasHtml( "Revise"),
                ShareRevision:$sce.trustasHtml( "Share revision"),
                Comments:$sce.trustasHtml( "Comments"),
                Download:$sce.trustasHtml( "Download"),
                Print:$sce.trustasHtml( "Print"),
                //paragraph above table
                WeirOrderNo:$sce.trustasHtml( "Weir Order No;"),
                QuoteRef:$sce.trustasHtml( "Your quote ref;"),
                PONumber:$sce.trustasHtml( "Your PO No;"),
                //table labels
                SerialNum:$sce.trustasHtml( "Serial number"),
                TagNum:$sce.trustasHtml( "Tag number(if available)"),
                PartNum:$sce.trustasHtml( "Part Number"),
                Description:$sce.trustasHtml( "Description of Part"),
                RecReplacement:$sce.trustasHtml( "Recommended replacement"),
                LeadTimeAvailability:$sce.trustasHtml( "Lead time / Availability"),
                PricePerItem:$sce.trustasHtml( "PricePerItem"),
                Quantity:$sce.trustasHtml( "Quantity"),
                Total:$sce.trustasHtml( "Total"),
                //labels to right of table
                Edit:$sce.trustasHtml( "Edit"),
                Removed:$sce.trustasHtml( "Removed"),
                Updated:$sce.trustasHtml( "Updated"),
                New:$sce.trustasHtml( "New"),
                //buttons above table
                BackToQuote:$sce.trustasHtml( "Back to Quotes"),
                AddNewItems:$sce.trustasHtml( "Add new items"),
                AddABlankItem:$sce.trustasHtml( "Add a blank item"),
                //footers
                YourRefNo:$sce.trustasHtml( "Your Reference No;"),
                DelieveryAddress:$sce.trustasHtml("Delievery Address"),
                YourAttachments:$sce.trustasHtml( "Your attachments"),
                YourComments:$sce.trustasHtml( "Your comments or instructions")
            }
        };
        vm.labels = labels[WeirService.Locale()];


}

