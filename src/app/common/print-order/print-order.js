angular.module('orderCloud')
    .controller('printOrderCtrl',PrintOrderController)
    .controller('printOrderBtnCtrl',PrintOrderButtonControl)
    .directive('printOrderButton',PrintOrderButtonDirective);

function PrintOrderController(printData,$timeout,$window,$uibModalInstance,WeirService,$sce,$filter) {
    var vm = this;
    vm.buyer = printData.buyer;
    vm.order = printData.order;
    vm.items = printData.items;
    vm.address = printData.address;
    var curr = WeirService.CurrentCurrency(vm.Quote);
    vm.currency = curr.symbol;

    vm.uitotal = $filter('OrderConversion')(printData.order.Total, printData.order);
    vm.CarriageRateForBuyer = vm.order.ShippingCost;
    vm.CarriageRateForBuyer = $filter('OrderConversion')(vm.CarriageRateForBuyer, printData.order);
    vm.CarriageRateForBuyer = vm.CarriageRateForBuyer.toFixed(2);

    var labels = {
        en: {
            QuoteNumber: "Quote Number; ",
            QuoteName: "Quote Name; ",
            YourReference: "Your Reference No; ",
            PONumber: "PO Number;",
            SerialNum: "Serial Number",
            TagNum: "Tag Number (if available)",
            PartNum: "Part Number",
            PartDesc: "Description of Part",
            RecRepl: "Recommended Replacement (yrs)",
            LeadTime: "Lead Time (days)",
            PricePer: "Price per Item or Set",
            Quantity: "Quantity",
            Total: "Total",
            DeliveryAddress: "Delivery Address",
            POAShipping: "POA",
            DescriptionOfShipping: {
                exworks:'Carriage - Ex Works',
                standard:'Carriage Charge'
            }
        },
        fr: {
            QuoteNumber: $sce.trustAsHtml("Num&eacute;ro de cotation "),
            QuoteName: $sce.trustAsHtml("Nom de la cotation "),
            YourReference: $sce.trustAsHtml("Votre num&eacute;ro de r&eacute;f&eacute;rence; "),
            PONumber: $sce.trustAsHtml("Numéro de bon de commande;"),
            SerialNum: $sce.trustAsHtml("Num&eacute;ro de S&eacute;rie"),
            TagNum: $sce.trustAsHtml("Numéro de repère soupape"),
            PartNum: $sce.trustAsHtml("R&eacute;f&eacute;rence de la pi&egrave;ce"),
            PartDesc: $sce.trustAsHtml("Description de la pi&egrave;ce"),
            RecRepl: $sce.trustAsHtml("Remplacement recommand&eacute; (ans)"),
            LeadTime: $sce.trustAsHtml("D&eacute;lai de livraison (journées)"),
            PricePer: $sce.trustAsHtml("Prix par item ou par kit"),
            Quantity: $sce.trustAsHtml("Quantit&eacute;"),
            Total: $sce.trustAsHtml("Total"),
            DeliveryAddress: $sce.trustAsHtml("Adresse de livraison"),
            POAShipping: "POA",
            DescriptionOfShipping: {
                exworks:$sce.trustAsHtml('Livraison Départ-Usine (EXW)'),
                standard:$sce.trustAsHtml('Frais de livraison')
            }
        }
    };
    vm.labels = labels[WeirService.Locale()];

    vm.close = function() {
        $uibModalInstance.dismiss();
    };

    $timeout($window.print,10);
}

//TODO There is no ME in the admin context. Need to pass the current buyer org and buyer user (not admin user).
function PrintOrderButtonControl($scope,imageRoot,WeirService,$uibModal,$sce,$document) {
    var vm = this;
    var labels = {
        en: {
            print:'Print'
        },
        fr: {
            print: $sce.trustAsHtml("Imprimer")
        }
    };
    vm.labels = labels['en'];//labels[WeirService.Locale()];
    vm.GetImageUrl = function(img) {
        return imageRoot + img;
    };

    vm.Print = function() {
        var printData = {
            buyer:$scope.buyer,
            order:$scope.order,
            items:$scope.items,
            address:$scope.address
        };
        var templates = {
            WVCUK:'common/print-order/templates/printorder.tpl.html',
            WPIFR:'common/print-order/templates/printorderfr.tpl.html'
        };
        var parentElem = angular.element($document[0].querySelector('body'));
        $uibModal.open({
            animation:true,
            size:'lg',
            templateUrl:templates[$scope.buyer.xp.WeirGroup.label],
            controller:'printOrderCtrl',
            controllerAs:'printctrl',
            appendTo: parentElem,
            resolve: {
                printData:printData
            }
        });
    };
}

function PrintOrderButtonDirective () {
    return {
        restrict:'E',
        scope: {
            buyer:'=buyer',
            order:'=order',
            items:'=items',
            address:'=address'
        },
        templateUrl:'common/print-order/templates/printorderbutton.tpl.html',
        controller:'printOrderBtnCtrl',
        controllerAs:'printbtn'
    };
}