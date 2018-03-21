angular.module('orderCloud')
    .config(WeirGroupSettingsConfig)
    .controller('StandardDeliveryCtrl', StandardDeliveryController)
    .controller('StandardDeliveryFR_ENCtrl', StandardDeliveryFR_ENController)
    .controller('POPrintContentCtrl', POPrintContentController)
    .controller('POPrintContentFR_ENCtrl', POPrintContentFR_ENController)
    .controller('SharedContentCtrl', SharedContentController)
    .controller('SharedContentFR_ENCtrl', SharedContentFR_ENController)
    .controller('CurrencyAdminCtrl', CurrencyAdminController)
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
        .state('standardDelivery.FR', {
            parent: "standardDelivery",
            templateUrl: 'weirGroupSettings/templates/standardDelivery.FR.tpl.html',
            controller: 'StandardDeliveryCtrl',
            controllerAs: 'delivery',
            url: '/FR',
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
        .state('standardDelivery.FR-EN', {
            parent: "standardDelivery",
            templateUrl: 'weirGroupSettings/templates/standardDelivery.FR-EN.tpl.html',
            controller: 'StandardDeliveryFR_ENCtrl',
            controllerAs: 'delivery',
            url: '/FR-EN',
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
        .state('poPrintContent.FR', {
            parent: "poPrintContent",
            templateUrl: 'weirGroupSettings/templates/poPrintContent.FR.tpl.html',
            controller: 'POPrintContentCtrl',
            controllerAs: 'pocontent',
            url: '/FR',
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
        .state('poPrintContent.FR-EN', {
            parent: "poPrintContent",
            templateUrl: 'weirGroupSettings/templates/poPrintContent.FR-EN.tpl.html',
            controller: 'POPrintContentFR_ENCtrl',
            controllerAs: 'pocontent',
            url: '/FR-EN',
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
        .state('sharedContent', {
            parent: 'base',
            templateUrl: 'weirGroupSettings/templates/sharedContent.tpl.html',
            controller: 'SharedContentCtrl',
            controllerAs: 'sharedcontent',
            url: '/sharedcontent',
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
        .state('sharedContent.FR', {
            parent: "sharedContent",
            templateUrl: 'weirGroupSettings/templates/sharedContent.FR.tpl.html',
            controller: 'SharedContentCtrl',
            controllerAs: 'sharedcontent',
            url: '/FR',
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
        .state('sharedContent.FR-EN', {
            parent: "sharedContent",
            templateUrl: 'weirGroupSettings/templates/sharedContent.FR-EN.tpl.html',
            controller: 'SharedContentFR_ENCtrl',
            controllerAs: 'sharedcontent',
            url: '/FR-EN',
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
        .state('currencyAdmin', {
            parent: 'base',
            templateUrl: 'weirGroupSettings/templates/currencyAdmin.tpl.html',
            controller: 'CurrencyAdminCtrl',
            controllerAs: 'currency',
            url: '/currency',
            data: { componentName: 'currencyAdmin' },
            resolve: {
                Me: function (OrderCloudSDK) {
                    return OrderCloudSDK.Me.Get();
                },
                BaseRateId: function (OrderCloudSDK, Me) {
                    return (Me.xp.WeirGroup.label === "WPIFR") ? "WPIFR-EUR" : "WVCUK-GBP";
                },
                StartCurrency: function (OrderCloudSDK, Me) {
                    return (Me.xp.WeirGroup.label === "WPIFR") ? "GBP" : "EUR";
                },
                Rates: function (OrderCloudSDK, BaseRateId, StartCurrency) {
                    try {
                        return OrderCloudSDK.Specs.Get(BaseRateId + "-" + StartCurrency);
                    } catch (ex) { return []; }
                }
            }
        });
}

function StandardDeliveryController($state, OrderCloudSDK, toastr, Me, WeirGroup, $sce) {
    var vm = this;
    vm.weirGroupID = WeirGroup.ID;
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
            Currency: "GBP",
            ChargeDescription: "Carriage Charge Description"
        },
        WPIFR: {
            EditHeader: "Edit Standard Carriage",
            EditInstructions: "If the standard carriage charge is updated on this screen it will update standard carriage charge for all customers assigned to the standard carriage charge",
            CarriageLabel: "FR Standard Carriage charge (default)",
            EditAction: "Edit",
            SaveAction: "Save",
            CancelAction: "Cancel",
            Currency: "EU",
            UpdateFR: "Update French language carriage charge description",
            UpdateEN: "Update English language carriage charge description",
            ChargeDescription: "Carriage Charge Description",
            SubHeader: $sce.trustAsHtml("Carriage Charge Description; <b>Francais</b>")
        }
    };
    vm.labels = labels[vm.weirGroupID];
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
            OrderCloudSDK.Catalogs.Patch(vm.weirGroupID, upd)
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

    vm.originalValues = WeirGroup.xp.DeliveryInformation || {};
    vm.edits = {
        Line1: {
            header: "Line 1",
            old: $sce.trustAsHtml(vm.originalValues.Line1 || ""),
            newValue: "",
            editable: false
        },
        Line2: {
            header: "Line 2",
            old: $sce.trustAsHtml(vm.originalValues.Line2 || ""),
            newValue: "",
            editable: false
        },
        Line3: {
            header: "Line 3",
            old: $sce.trustAsHtml(vm.originalValues.Line3 || ""),
            newValue: "",
            editable: false
        }
    };
    vm.editDeliveryInformation = function (name) {
        if (vm.edits[name]) {
            var tmp = vm.edits[name];
            tmp.editable = true;
            tmp.newValue = tmp.old;
        }
    };
    vm.cancelDeliveryInformation = function (name) {
        if (vm.edits[name]) {
            var tmp = vm.edits[name];
            tmp.editable = false;
            tmp.newValue = tmp.old;
        }
    };
    vm.saveDeliveryInformation = function (name) {
        if (vm.edits[name]) {
            var tmp = vm.edits[name];
            if (tmp.newValue != tmp.old) {
                var upd = {
                    xp: {
                        DeliveryInformation: {
                        }
                    }
                };
                upd.xp.DeliveryInformation[name] = tmp.newValue;
                //console.log("Update = " + JSON.stringify(upd));
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
            CancelAction: "Cancel",
            UpdateFR: "Update French language fixed print content",
            UpdateEN: "Update English language fixed print content",
            SubHeader: $sce.trustAsHtml("Fixed Print Content; <b>Francais</b>")
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

function POPrintContentFR_ENController(OrderCloudSDK, toastr, WeirGroup, $sce) {
    var vm = this;
    vm.weirGroupID = WeirGroup.ID;
    vm.labels = {
        EditAction: "Edit",
        SaveAction: "Save",
        CancelAction: "Cancel",
        SubHeader: $sce.trustAsHtml("Fixed Print Content; <b>English</b>")
    };
    vm.originalValues = WeirGroup.xp.POContentFR_EN || {};
    vm.edits = {
        Address: {
            header: "Address",
            old: vm.originalValues.Address || "",
            newValue: "",
            editable: false
        },
        Salutation: {
            header: $sce.trustAsHtml("<b>Salutation</b> (Leave salutation blank for English language print format)"),
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
            old: $sce.trustAsHtml(vm.originalValues.Line1Content || ""),
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
                        POContentFR_EN: {
                        }
                    }
                };
                upd.xp.POContentFR_EN[name] = tmp.newValue;
                //console.log("Update = " + JSON.stringify(upd));
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

function StandardDeliveryFR_ENController(OrderCloudSDK, toastr, WeirGroup, $sce) {
    var vm = this;
    vm.weirGroupID = WeirGroup.ID;
    vm.labels = {
        EditAction: "Edit",
        SaveAction: "Save",
        CancelAction: "Cancel",
        SubHeader: $sce.trustAsHtml("Carriage Charge Description; <b>English</b>")
    };
    vm.originalValues = WeirGroup.xp.DeliveryInformationFR_EN || {};
    vm.edits = {
        Line1: {
            header: "Line 1",
            old: $sce.trustAsHtml(vm.originalValues.Line1 || ""),
            newValue: "",
            editable: false
        },
        Line2: {
            header: "Line 2",
            old: $sce.trustAsHtml(vm.originalValues.Line2 || ""),
            newValue: "",
            editable: false
        },
        Line3: {
            header: "Line 3",
            old: $sce.trustAsHtml(vm.originalValues.Line3 || ""),
            newValue: "",
            editable: false
        }
    };
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
                        DeliveryInformationFR_EN: {
                        }
                    }
                };
                upd.xp.DeliveryInformationFR_EN[name] = tmp.newValue;
                //console.log("Update = " + JSON.stringify(upd));
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

function SharedContentController($state, OrderCloudSDK, toastr, Me, WeirGroup, $sce) {
    var vm = this;
    vm.weirGroupID = WeirGroup.ID;
    var labels = {
        WVCUK: {
            Header: "Shared Content",
            EditAction: "Edit",
            SaveAction: "Save",
            CancelAction: "Cancel"
        },
        WPIFR: {
            Header: "Shared Content",
            EditAction: "Edit",
            SaveAction: "Save",
            CancelAction: "Cancel",
            UpdateFR: "Update French language shared content",
            UpdateEN: "Update English language shared content",
            SubHeader: $sce.trustAsHtml("Shared Content; <b>Francais</b>")
        }
    };
    vm.labels = labels[vm.weirGroupID];
    vm.originalValues = WeirGroup.xp.SharedContent || {};
    if (vm.weirGroupID == 'WVCUK') {
        vm.edits = {
            ReplacementGuidance: {
                header: "Replacement Guidance",
                old: vm.originalValues.ReplacementGuidance || "",
                newValue: "",
                editable: false
            },
            POAGuidance: {
                header: "POA Guidance",
                old: vm.originalValues.POAGuidance || "",
                newValue: "",
                editable: false
            },
            LeadTimeNotice: {
                header: "Lead Time Notice",
                old: vm.originalValues.LeadTimeNotice || "",
                newValue: "",
                editable: false
            },
            PriceDisclaimer: {
                header: "Price Disclaimer",
                old: vm.originalValues.PriceDisclaimer || "",
                newValue: "",
                editable: false
            }
        };
    } else {
        vm.edits = {
            ReplacementGuidance: {
                header: "Replacement Guidance",
                old: vm.originalValues.ReplacementGuidance || "",
                newValue: "",
                editable: false
            },
            POAGuidance: {
                header: "POA Guidance",
                old: vm.originalValues.POAGuidance || "",
                newValue: "",
                editable: false
            },
            LeadTimeNotice: {
                header: "Lead Time Notice",
                old: vm.originalValues.LeadTimeNotice || "",
                newValue: "",
                editable: false
            },
            PriceDisclaimer: {
                header: "Price Disclaimer",
                old: vm.originalValues.PriceDisclaimer || "",
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
                        SharedContent: {
                        }
                    }
                };
                upd.xp.SharedContent[name] = tmp.newValue;
                // console.log("Update = " + JSON.stringify(upd));
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

function SharedContentFR_ENController(OrderCloudSDK, toastr, WeirGroup, $sce) {
    var vm = this;
    vm.weirGroupID = WeirGroup.ID;
    vm.labels = {
        EditAction: "Edit",
        SaveAction: "Save",
        CancelAction: "Cancel",
        SubHeader: $sce.trustAsHtml("Shared Content; <b>English</b>")
    };
    vm.originalValues = WeirGroup.xp.SharedContentFR_EN || {};
    vm.edits = {
        ReplacementGuidance: {
            header: "Replacement Guidance",
            old: vm.originalValues.ReplacementGuidance || "",
            newValue: "",
            editable: false
        },
        POAGuidance: {
            header: "POA Guidance",
            old: vm.originalValues.POAGuidance || "",
            newValue: "",
            editable: false
        },
        LeadTimeNotice: {
            header: "Lead Time Notice",
            old: vm.originalValues.LeadTimeNotice || "",
            newValue: "",
            editable: false
        },
        PriceDisclaimer: {
            header: "Price Disclaimer",
            old: vm.originalValues.PriceDisclaimer || "",
            newValue: "",
            editable: false
        }
    };
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
                        SharedContentFR_EN: {
                        }
                    }
                };
                upd.xp.SharedContentFR_EN[name] = tmp.newValue;
                //console.log("Update = " + JSON.stringify(upd));
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

function CurrencyAdminController(OrderCloudSDK, toastr, Me, BaseRateId, StartCurrency, Rates) {
    var vm = this;
    var hasFutureRate = false;
    vm.Group = Me.xp.WeirGroup.label;
    vm.NewStartDate = new Date();
    vm.OldStartDate = null;
    vm.NewRate = 0.0;
    var today= new Date();
    vm.Today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    vm.MinDate = today.getFullYear().toString() + "-" + (today.getMonth() + 1).toString() + "-" + today.getDate();
    vm.MaxDate = (today.getFullYear()+1).toString() + "-" + (today.getMonth() + 1).toString() + "-" + today.getDate();
    vm.labels = {
        Selection: "Currency; ",
        AddNew: "Set new Exchange rate",
        HistoryHeader: "Current / Previous Exchange rates"
    };
    vm.SelectedCurrency = StartCurrency;
    vm.SelectedRateHistory = [];
    vm.SelectCurrency = function (curr) {
        vm.SelectedCurrency = curr;
        var specId = BaseRateId + "-" + curr;
        OrderCloudSDK.Specs.Get(specId)
        .then(function (result) {
            processRates(result);
        })
        .catch(function (ex) {
            console.log("Failure: " + ex);
        });
    };
    vm.SaveNewRate = function () {
        var start = (typeof (vm.NewStartDate)) == 'object' ? vm.NewStartDate : Date.parse(vm.NewStartDate);
        var rate = parseFloat(vm.NewRate);
        if (!newRateIsValid(start, rate)) return;
        if (hasFutureRate) {
            updateExistingFutureRate(vm.SelectedCurrency);
        } else {
            createNewFutureRate(vm.SelectedCurrency);
        }
    };
    processRates(Rates);

    function newRateIsValid(start, rate) {
        var msg = "";
        if (!start || (start < vm.Today)) {
            msg = "A start date no earlier than today must be provided";
        } else {
            var oneYear = new Date(vm.Today.getFullYear() + 1, vm.Today.getMonth(), vm.Today.getDate());
            if (start > oneYear) {
                msg = "The new rate start date must be within one year of today";
            }
        }
        if (!rate || rate <= 0.0) {
            if (msg, length > 0) msg = msg + " \r\n";
            msg = msg + "A postive conversion rate is required";
        }
        if (msg) {
            toastr.error(msg, "Invalid rate requested");
        }
        return (msg.length == 0);
    }

    function processRates(rates) {
        hasFutureRate = false;
        vm.SelectedRateHistory = [];
        var ratelist = [];
        if (rates && rates.xp && rates.xp.rates) {
            var tmp = rates.xp.rates;
            for (var i = 0; i < tmp.length; i++) {
                var rte = tmp[i];
                ratelist.push({ Start: todate(rte.Start), End: todate(rte.End), Rate: rte.Rate });
            }
        }
        if (ratelist.length > 0) {
            ratelist.sort(function (a, b) { return b.Start - a.Start; });
            var first = ratelist[0];
            if (first.Start > new Date()) {
                vm.NewStartDate = first.Start;
                vm.NewRate = first.Rate;
                vm.OldStartDate = vm.NewRate;
                hasFutureRate = true;
            } else {
                vm.NewStartDate = new Date();
                vm.NewRate = first.Rate;
                vm.OldStartDate = null;
            }
            vm.SelectedRateHistory.push.apply(vm.SelectedRateHistory, ratelist);
        }
    }

    function todate(num) {
        if (num) {
            var year = num / 10000;
            var month = (num / 100) % 100 - 1;
            var day = (num % 100);
            return new Date(year, month, day);
        }
        return null;
    }
    function tonum(dte) {
        if (dte) {
            var val = (dte.getFullYear() * 100 + (dte.getMonth() + 1)) * 100 + dte.getDate();
            return val;
        }
        return null;
    }

    // TODO: Move these to a service - may be able to share partially with current rate retrieval method
    function updateExistingFutureRate(curr) {
        var specId = BaseRateId + "-" + curr;
        OrderCloudSDK.Specs.Get(specId)
        .then(function (res) {
            var tmp = [];
            var current = -1;
            var future = -1;
            if (res && res.xp && res.xp.rates) {
                var tmp = res.xp.rates;
                for (var i = 0; i < tmp.length && (future < 0 || current < 0); i++) {
                    var rte = tmp[i];
                    var start = todate(rte.Start);
                    var end = todate(rte.End);
                    if (end == null) {
                        future = i;
                    } else if (start <= vm.Today && end >= vm.Today) {
                        current = i;
                    }
                }
                if (current >= 0 && future >= 0) {
                    var tmpEnd = new Date(vm.NewStartDate.getTime());
                    tmpEnd.setDate(tmpEnd.getDate() - 1);
                    var newEndDate = tonum(tmpEnd);
                    var start = tonum(vm.NewStartDate);
                    var upd = {
                        xp: {
                        }
                    };
                    upd.xp.rates = tmp;
                    tmp[current].End = newEndDate;
                    tmp[future].Start = start;
                    tmp[future].Rate = vm.NewRate;
                    // console.log("Patch request: " + JSON.stringify(upd));
                    OrderCloudSDK.Specs.Patch(specId, upd)
                    .then(function () {
                        vm.SelectCurrency(curr);
                        toastr.success('Exchange rate updated', 'Success');
                    })
                    .catch(function(ex) {
                        toastr.error("Unable to update exchange rate", "Failure");
                        console.log("Update failed: " + ex);
                    });
                }
            }
        })
        .catch(function (ex) {
            toastr.error("Unable to update exchange rate", "Failure");
            console.log("Error: " + ex);
        });
    }
    function createNewFutureRate(curr) {
        var specId = BaseRateId + "-" + curr;
        OrderCloudSDK.Specs.Get(specId)
        .then(function (res) {
            var tmp = [];
            var current = -1;
            if (res && res.xp && res.xp.rates) {
                var tmp = res.xp.rates;
                for (var i = 0; i < tmp.length && current < 0; i++) {
                    var rte = tmp[i];
                    var end = todate(rte.End);
                    if (end == null) {
                        current = i;
                    }
                }
                if (current >= 0) {
                    var tmpEnd = new Date(vm.NewStartDate.getTime());
                    tmpEnd.setDate(tmpEnd.getDate() - 1);
                    var newEndDate = tonum(tmpEnd);
                    var start = tonum(vm.NewStartDate);
                    var upd = {
                        xp: {
                        }
                    };
                    upd.xp.rates = tmp;
                    tmp[current].End = newEndDate;
                    tmp.unshift({ Start: start, End: null, Rate: vm.NewRate });
                    // console.log("Patch request: " + JSON.stringify(upd));
                    OrderCloudSDK.Specs.Patch(specId, upd)
                    .then(function () {
                        toastr.success('Exchange rate created', 'Success');
                        vm.SelectCurrency(curr);
                    })
                    .catch(function (ex) {
                        toastr.error("Unable to create new exchange rate", "Failure");
                        console.log("Update failed: " + ex);
                    });
                }
            }
        })
        .catch(function (ex) {
            toastr.error("Unable to create new exchange rate", "Failure");
            console.log("Error: " + ex);
        });
    }
}
