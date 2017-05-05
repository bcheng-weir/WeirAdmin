angular.module('ordercloud-buyer-select', [])
    .directive('ordercloudSelectBuyer', SelectBuyerDirective)
    .controller('SelectBuyerCtrl', SelectBuyerController)
;

function SelectBuyerDirective() {
    return {
        scope: {
            align:'@'
        },
        restrict: 'E',
        templateUrl: 'common/buyer-select/templates/buyer-select.tpl.html',
        controller: 'SelectBuyerCtrl',
        controllerAs: 'selectBuyer'
    }
}

function SelectBuyerController($scope, $state, OrderCloudSDK, CurrentBuyer) {
    var vm = this;

    vm.align = $scope.align;

    OrderCloudSDK.Buyers.List().then(function(data) {
        vm.BuyerList = data;
    });

    OrderCloudSDK.Buyers.Get(CurrentBuyer.GetBuyerID()).then(function(data) {
        vm.selectedBuyer = data;
    });

    vm.ChangeBuyer = function(buyer) {
        OrderCloudSDK.Buyers.Get(buyer.ID).then(function(data) {
            vm.selectedBuyer = data;
            CurrentBuyer.SetBuyerID(data.ID);
            $state.reload($state.current);
        });
    };

    vm.pagingfunction = function() {
        if (vm.BuyerList.Meta.Page <= vm.BuyerList.Meta.TotalPages) {
            OrderCloudSDK.Buyers.List(null, vm.BuyerList.Meta.Page + 1, vm.BuyerList.Meta.PageSize)
                .then(function(data) {
                    vm.BuyerList.Meta = data.Meta;
                    vm.BuyerList.Items = [].concat(vm.BuyerList.Items, data.Items);
                });
        }
    }
}
