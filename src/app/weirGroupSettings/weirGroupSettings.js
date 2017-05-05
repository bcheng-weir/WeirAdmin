angular.module('orderCloud')
    .config(WeirGroupSettingsConfig)
    .controller('StandardDeliveryCtrl', StandardDeliveryController)
    .controller('POPrintContentCtrl', POPrintContentController)
;

function WeirGroupSettingsConfig($stateProvider) {
    $stateProvider
        .state('standardDelivery', {
            parent: 'base',
            templateUrl: 'weirGroupSettings/templates/standardDelivery.tpl.html',
            controller: 'StandardDeliveryCtrl',
            controllerAs: 'delivery',
            url: '/carriage',
            data: { componentName: 'WeirGroupSettings' },
            resolve : {
                Me: function(OrderCloudSDK) {
                    return OrderCloudSDK.Me.Get();
                },
                WeirGroup: function(OrderCloudSDK, Me) {
	                var groupId = Me.xp.WeirGroup.label;
                    return OrderCloudSDK.Catalogs.Get(groupId);
                }
            }
        })
        .state('poPrintContent', {
            parent: 'base',
            templateUrl: 'weirGroupSettings/templates/poPrintContent.tpl.html',
            controller: 'POPrintContentCtrl',
            controllerAs: 'pocontent',
            url: '/pocontent',
            data: { componentName: 'WeirGroupSettings' },
            resolve: {
                Me: function (OrderCloudSDK) {
                    return OrderCloudSDK.Me.Get();
                },
                WeirGroup: function (OrderCloudSDK, Me) {
                    var groupId = Me.xp.WeirGroup.label;
                    return OrderCloudSDK.Catalogs.Get(groupId);
                }
            }
        })
    ;
}

function StandardDeliveryController($state, OrderCloudSDK, toastr, Me, WeirGroup) {
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
    vm.Edit = function () { vm.editable = true; };
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
            OrderCloudSDK.Catalogs.Patch(weirGroupID, upd)
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

function POPrintContentController($state, OrderCloudSDK, toastr, Me, WeirGroup, $sce) {
    var vm = this;
    vm.weirGroupID = WeirGroup.ID;
    var labels = {
        WVCUK: {
            Header: "Fixed Print Content",
            EditAction: "Edit",
            SaveAction: "Save",
            CancelAction: "Cancel"
        },
        WPIFR: {
            Header: "Fixed Print Content",
            EditAction: "Edit",
            SaveAction: "Save",
            CancelAction: "Cancel"
        }
    };
    vm.labels = labels[vm.weirGroupID];
    vm.originalValues = WeirGroup.xp.POContent || {};
    if (vm.weirGroupID == 'WVCUK') {
        vm.edits = {
            Address: {
                header: "Address",
                old: vm.originalValues.Address || "",
                newValue: "",
                editable: false
            },
            Message: {
                header: "Thank You Message",
                old: vm.originalValues.Message || "",
                newValue: "",
                editable: false
            },
            VATDisclaimer: {
                header: "VAT Price Disclaimer",
                old: vm.originalValues.VATDisclaimer || "",
                newValue: "",
                editable: false
            },
            DocDisclaimer: {
                header: "Documentation Disclaimer",
                old: vm.originalValues.DocDisclaimer || "",
                newValue: "",
                editable: false
            },
            SalesDisclaimer: {
                header: "Conditions of Sale Disclaimer",
                old: vm.originalValues.SalesDisclaimer || "",
                newValue: "",
                editable: false
            },
            VatExtraNotice: {
                header: "VAT Extra line",
                old: vm.originalValues.VatExtraNotice || "",
                newValue: "",
                editable: false
            },
            RegisteredAddress: {
                header: "Registered Address",
                old: vm.originalValues.RegisteredAddress || "",
                newValue: "",
                editable: false
            }
        };
    } else {
        vm.edits = {
            Address: {
                header: "Address",
                old: vm.originalValues.Address || "",
                newValue: "",
                editable: false
            },
            Salutation: {
                header: "Salutation",
                old: vm.originalValues.Salutation || "",
                newValue: "",
                editable: false
            },
            SalutationMessage: {
                header: "Salutation Message",
                old: vm.originalValues.SalutationMessage || "",
                newValue: "",
                editable: false
            },
            Line1Header: {
                header: "Line 1 Header",
                old: $sce.trustAsHtml(vm.originalValues.Line1Header || ""),
                newValue: "",
                editable: false
            },
            Line1Content: {
                header: "Line 1 Content",
                old: $sce.trustAsHtml(vm.originalValues.Line1Content|| ""),
                newValue: "",
                editable: false
            },
            Line2Header: {
                header: "Line 2 Header",
                old: $sce.trustAsHtml(vm.originalValues.Line2Header || ""),
                newValue: "",
                editable: false
            },
            Line2Content: {
                header: "Line 2 Content",
                old: $sce.trustAsHtml(vm.originalValues.Line2Content || ""),
                newValue: "",
                editable: false
            },
            Line3Header: {
                header: "Line 3 Header",
                old: $sce.trustAsHtml(vm.originalValues.Line3Header || ""),
                newValue: "",
                editable: false
            },
            Line3Content: {
                header: "Line 3 Content",
                old: $sce.trustAsHtml(vm.originalValues.Line3Content || ""),
                newValue: "",
                editable: false
            },
            Line4Header: {
                header: "Line 4 Header",
                old: $sce.trustAsHtml(vm.originalValues.Line4Header || ""),
                newValue: "",
                editable: false
            },
            Line4Content: {
                header: "Line 4 Content",
                old: $sce.trustAsHtml(vm.originalValues.Line4Content || ""),
                newValue: "",
                editable: false
            },
            Line5Header: {
                header: "Line 5 Header",
                old: $sce.trustAsHtml(vm.originalValues.Line5Header || ""),
                newValue: "",
                editable: false
            },
            Line5Content: {
                header: "Line 5 Content",
                old: $sce.trustAsHtml(vm.originalValues.Line5Content || ""),
                newValue: "",
                editable: false
            },
            ClosingLine: {
                header: "Closing Line",
                old: $sce.trustAsHtml(vm.originalValues.ClosingLine || ""),
                newValue: "",
                editable: false
            },
            RegisteredAddress: {
                header: "Registered Address",
                old: $sce.trustAsHtml(vm.originalValues.RegisteredAddress || ""),
                newValue: "",
                editable: false
            }
        };
    }
    vm.edit = function (name) {
        if (vm.edits[name]) {
            var tmp = vm.edits[name];
            tmp.editable = true;
            tmp.newValue = tmp.old;
        }
    };
    vm.cancel = function (name) {
        if (vm.edits[name]) {
            var tmp = vm.edits[name];
            tmp.editable = false;
            tmp.newValue = tmp.old;
        }
    };
    vm.save = function (name) {
        if (vm.edits[name]) {
            var tmp = vm.edits[name];
            if (tmp.newValue != tmp.old) {
                var upd = {
                    xp: {
                        POContent: {
                        }
                    }
                };
                upd.xp.POContent[name] = tmp.newValue;
                console.log("Update = " + JSON.stringify(upd));
                OrderCloudSDK.Catalogs.Patch(vm.weirGroupID, upd)
                .then(function () {
                    tmp.old = tmp.newValue;
                    toastr.success(tmp.header + ' Updated', 'Success');
                    tmp.editable = false;
                })
                .catch(function (err) {
                    $exceptionHandler(ex);
                });
            } else {
                tmp.editable = false;
            }
        }
    }
}
