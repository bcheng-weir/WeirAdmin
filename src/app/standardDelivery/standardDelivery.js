angular.module('orderCloud')
    .config(StandardDeliveryConfig)
    .controller('StandardDeliveryCtrl', StandardDeliveryController)
;

function StandardDeliveryConfig($stateProvider) {
    $stateProvider
        .state('standardDelivery', {
            parent: 'base',
            templateUrl: 'standardDelivery/templates/standardDelivery.tpl.html',
            controller: 'StandardDeliveryCtrl',
            controllerAs: 'delivery',
            url: '/carriage',
            data: {componentName: 'Standard Delivery'},
            resolve : {
                Me: function(OrderCloud) {
                    return OrderCloud.Me.Get();
                },
                WeirGroup: function(OrderCloud, Me) {
	            var groupId = Me.xp.WeirGroup.label;
                    return OrderCloud.Catalogs.Get(groupId);
                }
            }
        });
}

function StandardDeliveryController($state, OrderCloud, toastr, Me, WeirGroup) {
    var vm = this;
    var weirGroupID = WeirGroup.ID;
    vm.originalRate = (WeirGroup.xp && WeirGroup.xp.StandardCarriage) ? WeirGroup.xp.StandardCarriage : 0.00;
    vm.newRate = vm.originalRate;
    vm.rateStr = vm.newRate.toFixed(2);
    vm.editable = false;
    var labels = {
        WVCUK: {
            EditHeader: "Edit Standard Carriage",
            EditInstructions: "If the standard carriage charge is updated on this screen it will update standard carriage charge for all customers assigned to the standard carriage charge",
            CarriageLabel: "UK Standard Carriage charge (default)",
            EditAction: "Edit",
            SaveAction: "Save",
            CancelAction: "Cancel",
            Currency: "GBP"
        },
        WPIFR: {
            EditHeader: "Edit Standard Carriage",
            EditInstructions: "If the standard carriage charge is updated on this screen it will update standard carriage charge for all customers assigned to the standard carriage charge",
            CarriageLabel: "FR Standard Carriage charge (default)",
            EditAction: "Edit",
            SaveAction: "Save",
            CancelAction: "Cancel",
            Currency: "EU"
        }
    };
    vm.labels = labels[weirGroupID];
    vm.Edit = function () { vm.editable = true; }
    vm.Cancel = function () {
        vm.newRate = vm.originalRate;
        vm.editable = false;
    };
    vm.Save = function () {
        if (vm.newRate && vm.newRate != vm.originalRate) {
            var upd = {
                xp: {
                    StandardCarriage: vm.newRate
                }
            };
            OrderCloud.Catalogs.Patch(upd, weirGroupID)
            .then(function () {
                vm.editable = false;
                vm.originalRate = vm.newRate;
                vm.rateStr = vm.newRate.toFixed(2);
                toastr.success('Carriage Rate Updated', 'Success');
            })
            .catch(function (err) {
                $exceptionHandler(ex);
            });
        } else {
            vm.editable = false;
        }
    };
}

