angular.module('orderCloud')
    .config(BuyerAddressConfig)
    .factory('BuyerAddressService', BuyerAddressService)
    .controller('BuyerAddressCtrl', BuyerAddressCtrl)
    .controller('BuyerAddressEditCtrl', BuyerAddressEditCtrl)
    .controller('BAAddressEditCtrl', BAAddressEditCtrl)
    .controller('BuyerAddressCreateCtrl', BuyerAddressCreateCtrl)
    .controller('BAAddressCreateCtrl', BAAddressCreateCtrl)
;

function BuyerAddressConfig($stateProvider) {
    $stateProvider
        .state('buyersAddresses', {
            parent: 'base',
            templateUrl: 'buyersAddresses/templates/buyersAddresses.tpl.html',
            controller: 'BuyerAddressCtrl',
            controllerAs: 'buyersAddresses',
            url: '/buyersAddresses?search&page&pageSize',
            data: {componentName: 'BuyersAddresses'},
            resolve: {
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                BuyerList: function(OrderCloud, Parameters) {
                    return OrderCloud.Buyers.List(Parameters.search, Parameters.page, Parameters.pageSize);
                }
            }
        })
        .state('buyersAddresses.edit', {
            url: '/:buyerid/edit?search&page&pageSize&searchOn&sortBy&filters   ',
            templateUrl: 'buyersAddresses/templates/buyersAddressesEdit.tpl.html',
            controller: 'BuyerAddressEditCtrl',
            controllerAs: 'buyersAddressesEdit',
            resolve: {
                SelectedBuyer: function($stateParams, OrderCloud){
                    return OrderCloud.Buyers.Get($stateParams.buyerid)
                },
                AddressList: function(OrderCloud, $stateParams, Parameters) {
                    //return OrderCloud.Addresses.List(Parameters.search, Parameters.page, Parameters.pageSize || 12, Parameters.searchOn, Parameters.sortBy, Parameters.filters);
                    return OrderCloud.Addresses.List(null,null,null,null,null,null,$stateParams.buyerid);
                }
            }
        })
        .state('buyersAddresses.edit.addressEdit', {
            url: '/:buyerid/edit/:addressid',
            templateUrl: 'buyersAddresses/templates/addressEdit.tpl.html',
            controller: 'BAAddressEditCtrl',
            controllerAs: 'BAaddressEdit',
            resolve: {
                SelectedBuyer: function($stateParams, OrderCloud){
                    return OrderCloud.Buyers.Get($stateParams.buyerid)
                },
                SelectedAddress: function($stateParams, $state, OrderCloud) {
                    return OrderCloud.Addresses.Get($stateParams.addressid,$stateParams.buyerid).catch(function() {
                        console.writeline("failed to get address");
                        //$state.go('^');
                    });
                }
            }
        })
        .state('buyersAddresses.edit.addressCreate', {
            url: '/:buyerid/edit/address/create',
            templateUrl: 'buyersAddresses/templates/addressCreate.tpl.html',
            controller: 'BAAddressCreateCtrl',
            controllerAs:'BAaddressCreate',
            resolve: {
                SelectedBuyer: function($stateParams, OrderCloud) {
                    return OrderCloud.Buyers.Get($stateParams.buyerid)
                }
            }
        })
        .state('buyersAddresses.create', {
            url: '/create',
            templateUrl: 'buyersAddresses/templates/buyersAddressesCreate.tpl.html',
            controller: 'BuyerAddressCreateCtrl',
            controllerAs: 'buyersAddressesCreate'
        });

}

function BuyerAddressService($q, $state, OrderCloud, toastr, Underscore) {
    var _divisions = [{id: "1", label: "UK"}, {id: "2", label: "France"}];
    var _customerTypes = [{id: "1", label: "End User"}, {id: "2", label: "Service Company"}];

    function AbortError() {}

    function _createBuyerAndAddress(buyer, address) {
        address.xp = {};
        address.xp.primary = true;
        var newBuyerID = null;

        return OrderCloud.Buyers.Create(buyer)
            .then(function(res) {
                newBuyerID = res.ID;
                OrderCloud.Addresses.Create(address, newBuyerID);
            })
            .then(function() {
                $state.go('buyersAddresses.edit', {"buyerid": newBuyerID}, {reload: true});
                toastr.success('Records Created', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    }

    function _updatePrimaryAddress(buyer, address) {
        // if vm.address.xp && vm.address.xp.primary === true
        // OrderCloud.Addresses.List(null,null,null,null,null,null,SelectedBuyer.ID)
        // then find the one already marked as primary. if its ID === vm.addressid continue
        // else, update currentPrimary to have xp.primary = false
        // perform normal address.update.
        var primaryAddress = null;
        if(address.xp && address.xp.primary === true)
        {
            OrderCloud.Addresses.List(null,null,null,null,null,null,buyer.ID)
                .then(function(resp) {
                    primaryAddress = Underscore.find(resp.Items,function(item) {
                        return item.xp.primary == true;
                    });
                    if (primaryAddress && (primaryAddress.ID === address.ID)) {
                        throw new AbortError(); // Do not perform the update.
                    } else {
                        primaryAddress.xp.primary = false;
                        return true;
                    }
                })
                .then(function() {
                    OrderCloud.Addresses.Patch(primaryAddress.ID, primaryAddress, buyer.ID);
                })
                .then(function(resp) {
                    toastr.success("Old primary address unset.","Primary Address Changed");
                })
                .catch(function(ex) {
                    $exceptionHandler(ex);
                });
        }
    }

    return {
        Divisions: _divisions,
        CustomerTypes: _customerTypes,
        CreateBuyerWithPrimaryAddress: _createBuyerAndAddress,
        UpdatePrimaryAddress: _updatePrimaryAddress
    };
}

function BuyerAddressCtrl($state, $ocMedia, OrderCloud, OrderCloudParameters, Parameters, BuyerList) {
    var vm = this;
    vm.list = BuyerList;
    vm.parameters = Parameters;
    vm.sortSelection =  Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;

    //check if filters are applied
    vm.filtersApplied = vm.parameters.filters || ($ocMedia('max-width:767px') && vm.sortSelection); //Sort by is a filter on mobile devices
    vm.showFilters = vm.filtersApplied;

    //check if search was used
    vm.searchResults = Parameters.search && Parameters.search.length > 0; //Why parameters instead of vm.parameters?

    //Reload the state with new parameters
    vm.filter = function(resetPage) {
        $state.go('.', OrderCloudParameters.Create(vm.parameters, resetPage));
    };

    //Reload the page with new search parameter & reset the page.
    vm.search = function() {
        vm.filter(true);
    };

    //Clear the search parameter, reload the state and reset the page
    vm.clearSearch = function() {
        vm.parameters.search = null;
        vm.filter(true);
    };

    //Clear the relevant filters, reload the state and reset the page
    vm.clearFilters = function() {
        vm.parameters.filters = null;
        $ocMedia('max-width:767px') ? vm.parameters.sortBy = null : angular.noop(); //Clear out sort by on mobile devices.
        vm.filter(true);
    };

    //Conditionally set, reverse, remove the sortBy parameter & reload the state.
    vm.updateSort = function(value) {
        value ? angular.noop() : value = vm.sortSelection;
        switch(vm.parameters.sortBy) {
            case value:
                vm.parameters.sortBy = '!' + value;
                break;
            case '!' + value:
                vm.parameters.sortBy = null;
                break;
            default:
                vm.parameters.sortBy = value;
        }
        vm.filter(false);
    };

    //used on mobile devices
    vm.reverseSort = function() {
        Parameters.sortBy.indexOf('!') == 0 ? vm.parameters.sortBy = Parameters.sortBy.split('!')[1] : vm.parameters.sortBy = '!' + Parameters.sortBy;
        vm.filter(false);
    };

    //Reload the state with the incremented page parameter
    vm.pageChanged = function() {
        $state.go('.', {page:vm.list.Meta.Page});
    };

    //Load the next page of results with all of the same parameters.
    vm.loadMore = function() {
        return OrderCloud.Buyers.List(Parameters.search, vm.list.Meta.Page + 1, parameters.pageSize || vm.list.Meta.PageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };
}

function BuyerAddressEditCtrl($exceptionHandler, $state, $ocMedia, toastr, OrderCloud, SelectedBuyer, AddressList, BuyerAddressService, Parameters) {
    var vm = this;
    vm.buyer = SelectedBuyer;
    vm.list = AddressList;
    vm.parameters = Parameters;
    vm.sortSelection =  Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;

    //check if filters are applied
    vm.filtersApplied = vm.parameters.filters || ($ocMedia('max-width:767px') && vm.sortSelection); //Sort by is a filter on mobile devices
    vm.showFilters = vm.filtersApplied;

    //check if search was used
    vm.searchResults = Parameters.search && Parameters.search.length > 0; //Why parameters instead of vm.parameters?

    //Reload the state with new parameters
    vm.filter = function(resetPage) {
        $state.go('.', OrderCloudParameters.Create(vm.parameters, resetPage));
    };

    //Reload the page with new search parameter & reset the page.
    vm.search = function() {
        vm.filter(true);
    };

    //Clear the search parameter, reload the state and reset the page
    vm.clearSearch = function() {
        vm.parameters.search = null;
        vm.filter(true);
    };

    //Clear the relevant filters, reload the state and reset the page
    vm.clearFilters = function() {
        vm.parameters.filters = null;
        $ocMedia('max-width:767px') ? vm.parameters.sortBy = null : angular.noop(); //Clear out sort by on mobile devices.
        vm.filter(true);
    };

    //Conditionally set, reverse, remove the sortBy parameter & reload the state.
    vm.updateSort = function(value) {
        value ? angular.noop() : value = vm.sortSelection;
        switch(vm.parameters.sortBy) {
            case value:
                vm.parameters.sortBy = '!' + value;
                break;
            case '!' + value:
                vm.parameters.sortBy = null;
                break;
            default:
                vm.parameters.sortBy = value;
        }
        vm.filter(false);
    };

    //used on mobile devices
    vm.reverseSort = function() {
        Parameters.sortBy.indexOf('!') == 0 ? vm.parameters.sortBy = Parameters.sortBy.split('!')[1] : vm.parameters.sortBy = '!' + Parameters.sortBy;
        vm.filter(false);
    };

    //Reload the state with the incremented page parameter
    vm.pageChanged = function() {
        $state.go('.', {page:vm.list.Meta.Page});
    };

    //Load the next page of results with all of the same parameters.
    vm.loadMore = function() {
        return OrderCloud.Buyers.List(Parameters.search, vm.list.Meta.Page + 1, parameters.pageSize || vm.list.Meta.PageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };

    vm.buyerName = SelectedBuyer.Name;
    vm.divisions = BuyerAddressService.Divisions;
    vm.types = BuyerAddressService.CustomerTypes;

    vm.Submit = function() {
        OrderCloud.Buyers.Update(vm.buyer, SelectedBuyer.ID)
            .then(function() {
                $state.go('buyersAddresses', {}, {reload: true});
                toastr.success('Buyer Updated', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };
}

function BuyerAddressCreateCtrl($exceptionHandler, $scope, $state, toastr, OrderCloud, BuyerAddressService, OCGeography) {
    var vm = this;
    vm.divisions = BuyerAddressService.Divisions;
    vm.types = BuyerAddressService.CustomerTypes;
    //vm.primaryAddress = {}; //Determine this in the config, BuyerAddressEdit.
    vm.address = {
        Country: 'US' //This defaults create addresses to the US. Change to UK?
    };
    vm.countries = OCGeography.Countries;
    vm.states = OCGeography.States;

    //Watch the country.
    $scope.$watch(function() {
        return vm.address.Country
    }, function() {
        vm.address.State = null; //If the country changes, null the state.
    });

    vm.Submit = function() {
        BuyerAddressService.CreateBuyerWithPrimaryAddress(vm.buyer, vm.address);
    };
}

function BAAddressEditCtrl($exceptionHandler, $state, $scope, toastr, OrderCloud, OCGeography, BuyerAddressService, SelectedBuyer, SelectedAddress) {
    var vm = this,
        addressID = SelectedAddress.ID;
    vm.addressName = SelectedAddress.AddressName;
    vm.address = SelectedAddress;
    vm.countries = OCGeography.Countries;
    vm.states = OCGeography.States;

    $scope.$watch(function() {
        return vm.address.Country
    }, function() {
        //vm.address.State = null;
    });

    vm.Submit = function() {
        BuyerAddressService.UpdatePrimaryAddress(SelectedBuyer, vm.address);
        OrderCloud.Addresses.Update(addressID, vm.address, SelectedBuyer.ID)
            .then(function() {
                $state.go('buyersAddresses.edit', {"buyerid": SelectedBuyer.ID}, {reload: true});
                toastr.success('Address Updated', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };

    vm.Delete = function() {
        OrderCloud.Addresses.Delete(SelectedAddress.ID, SelectedBuyer.ID)
            .then(function() {
                $state.go('buyersAddresses.edit', {"buyerid": SelectedBuyer.ID}, {reload: true});
                toastr.success('Address Deleted', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };
}

function BAAddressCreateCtrl($exceptionHandler, $scope, $state, toastr, OrderCloud, OCGeography, BuyerAddressService, SelectedBuyer) {
    var vm = this;
    vm.address = {
        Country: 'US' // this is to default 'create' addresses to the country US
    };
    vm.countries = OCGeography.Countries;
    vm.states = OCGeography.States;

    $scope.$watch(function() {
        return vm.address.Country
    }, function() {
        vm.address.State = null;
    });

    vm.Submit = function() {
        BuyerAddressService.UpdatePrimaryAddress(SelectedBuyer, vm.address);
        OrderCloud.Addresses.Create(vm.address, SelectedBuyer.ID)
            .then(function() {
                $state.go('buyersAddresses.edit', {"buyerid": SelectedBuyer.ID}, {reload: true});
                toastr.success('Address Created', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };
}