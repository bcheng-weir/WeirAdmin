angular.module('orderCloud')
    .config(BuyerAddressConfig)
    .factory('BuyerAddressService', BuyerAddressService)
    .controller('BuyerAddressCtrl', BuyerAddressCtrl)
    .controller('BuyerAddressEditCtrl', BuyerAddressEditCtrl)
    .controller('AddressEditCtrl', AddressEditCtrl)
    .controller('BuyerAddressCreateCtrl', BuyerAddressCreateCtrl)
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
            controller: 'AddressEditCtrl',
            controllerAs: 'addressEdit',
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
        .state('buyersAddresses.create', {
            url: '/create',
            templateUrl: 'buyersAddresses/templates/buyersAddressesCreate.tpl.html',
            controller: 'BuyerAddressCreateCtrl',
            controllerAs: 'buyersAddressesCreate'
        });

}

function BuyerAddressService($q, $state, OrderCloud, toastr) {
    var _divisions = [{id: "1", label: "UK"}, {id: "2", label: "France"}];
    var _customerTypes = [{id: "1", label: "End User"}, {id: "2", label: "Service Company"}];

    function _createBuyerAndAddress(buyer, address) {
        address.xp = {};
        address.xp.primary = true;

        return OrderCloud.Buyers.Create(buyer)
            .then(function(res) {
                OrderCloud.Addresses.Create(address, res.ID);

            })
            .then(function() {
                $state.go('buyersAddresses.edit', {}, {reload: true});
                toastr.success('Records Created', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    }

    return {
        Divisions: _divisions,
        CustomerTypes: _customerTypes,
        CreateBuyerWithPrimaryAddress: _createBuyerAndAddress
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

function AddressEditCtrl($exceptionHandler, $state, $scope, toastr, OrderCloud, OCGeography, SelectedBuyer, SelectedAddress) {
    var vm = this,
        addressID = SelectedAddress.ID;
    vm.addressName = SelectedAddress.AddressName;
    vm.address = SelectedAddress;
    vm.countries = OCGeography.Countries;
    vm.states = OCGeography.States;

    $scope.$watch(function() {
        return vm.address.Country
    }, function() {
        vm.address.State = null;
    });

    vm.Submit = function() {
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
        OrderCloud.Addresses.Delete(SelectedAddress.ID, false)
            .then(function() {
                $state.go('buyersAddresses.edit', {"buyerid": SelectedBuyer.ID}, {reload: true});
                toastr.success('Address Deleted', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };
}