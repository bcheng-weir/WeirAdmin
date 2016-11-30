angular.module('orderCloud')
    .config(AdminUsersConfig)
    .service('AdminGroupService', AdminGroupService)
    .controller('AdminUsersCtrl', AdminUsersController)
    .controller('AdminUserEditCtrl', AdminUserEditController)
    .controller('AdminUserCreateCtrl', AdminUserCreateController)
;
function AdminGroupService($q, OrderCloud) {
    return {
        UpdateAdminGroup: _updateAdminGroup
    };
    function _updateAdminGroup(userID, oldGroupID, newGroupID) {
        var d = $q.defer();
        if (oldGroupID) {
            if (newGroupID && (newGroupID != oldGroupID)) {
                OrderCloud.AdminUserGroups.DeleteUserAssignment(oldGroupID, userID)
                .then(function () {
                    OrderCloud.AdminUserGroups.SaveUserAssignment({ UserGroupID: newGroupID, UserID: userID })
                    .then(function () {
                        d.resolve();
                    });
                })
                .catch(function (ex) {
                    d.reject(ex);
                });
            } else {
                d.resolve();
            }
        } else if (newGroupID) {
            OrderCloud.AdminUserGroups.SaveUserAssignment({ UserGroupID: newGroupID, UserID: userID })
            .then(function () {
                d.resolve();
            })
            .catch(function(ex) {
                d.reject(ex);
            });
        }
        return d.promise;
    }

}

function AdminUsersConfig($stateProvider) {
    $stateProvider
        .state('adminUsers', {
            parent: 'base',
            templateUrl: 'adminUsers/templates/adminUsers.tpl.html',
            controller: 'AdminUsersCtrl',
            controllerAs: 'adminUsers',
            url: '/adminusers?search&page&pageSize&searchOn&sortBy&filters',
            data: {componentName: 'Admin Users'},
            resolve : {
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                AdminUsersList: function(OrderCloud, Parameters, $state) {
                    return OrderCloud.AdminUsers.List(Parameters.search, Parameters.page, Parameters.pageSize || 12, Parameters.searchOn, Parameters.sortBy, Parameters.filters)
                        .then(function(data) {
                            if (data.Items.length == 1 && Parameters.search) {
                                $state.go('adminUsers.edit', {adminuserid:data.Items[0].ID});
                            } else {
                                return data;
                            }
                        });
                }
            }
        })
        .state('adminUsers.edit', {
            url: '/:adminuserid/edit',
            templateUrl: 'adminUsers/templates/adminUserEdit.tpl.html',
            controller: 'AdminUserEditCtrl',
            controllerAs: 'adminUserEdit',
            resolve: {
                SelectedAdminUser: function($stateParams, OrderCloud) {
                    return OrderCloud.AdminUsers.Get($stateParams.adminuserid);
                },
                AdminGroupsAvailable : function(OrderCloud) {
                    // return OrderCloud.AdminUserGroups.List(null, 1, 20, null, "Name");
                    return OrderCloud.AdminUserGroups.List();
                },
                CurrentGroups: function ($stateParams, OrderCloud) {
                    return OrderCloud.AdminUserGroups.ListUserAssignments(null, $stateParams.adminuserid)
                }
            }
        })
        .state('adminUsers.create', {
            url: '/create',
            templateUrl: 'adminUsers/templates/adminUserCreate.tpl.html',
            controller: 'AdminUserCreateCtrl',
            controllerAs: 'adminUserCreate',
            resolve: {
                AdminGroupsAvailable: function (OrderCloud) {
                    return OrderCloud.AdminUserGroups.List();
                    // return OrderCloud.AdminUserGroups.List(null, 1, 20, null, "Name");
                }
            }
        })
}

function AdminUsersController($state, $ocMedia, OrderCloud, OrderCloudParameters, AdminUsersList, Parameters) {
    var vm = this;
    vm.list = AdminUsersList;
    vm.parameters = Parameters;
    vm.sortSelection = Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;

    //Check if filters are applied
    vm.filtersApplied = vm.parameters.filters || ($ocMedia('max-width:767px') && vm.sortSelection); //Sort by is a filter on mobile devices
    vm.showFilters = vm.filtersApplied;

    //Check if search was used
    vm.searchResults = Parameters.search && Parameters.search.length > 0;

    //Reload the state with new parameters
    vm.filter = function(resetPage) {
        $state.go('.', OrderCloudParameters.Create(vm.parameters, resetPage));
    };

    //Reload the state with new search parameter & reset the page
    vm.search = function() {
        vm.filter(true);
    };

    //Clear the search parameter, reload the state & reset the page
    vm.clearSearch = function() {
        vm.parameters.search = null;
        vm.filter(true);
    };

    //Clear relevant filters, reload the state & reset the page
    vm.clearFilters = function() {
        vm.parameters.filters = null;
        $ocMedia('max-width:767px') ? vm.parameters.sortBy = null : angular.noop(); //Clear out sort by on mobile devices
        vm.filter(true);
    };

    //Conditionally set, reverse, remove the sortBy parameter & reload the state
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

    //Used on mobile devices
    vm.reverseSort = function() {
        Parameters.sortBy.indexOf('!') == 0 ? vm.parameters.sortBy = Parameters.sortBy.split('!')[1] : vm.parameters.sortBy = '!' + Parameters.sortBy;
        vm.filter(false);
    };

    //Reload the state with the incremented page parameter
    vm.pageChanged = function() {
        $state.go('.', {page:vm.list.Meta.Page});
    };

    //Load the next page of results with all of the same parameters
    vm.loadMore = function() {
        return OrderCloud.AdminUsers.List(Parameters.search, vm.list.Meta.Page + 1, Parameters.pageSize || vm.list.Meta.PageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };
}

function AdminUserEditController(AdminGroupService, $exceptionHandler, $state, toastr, OrderCloud, SelectedAdminUser, AdminGroupsAvailable, CurrentGroups) {
    var vm = this,
    adminuserid = SelectedAdminUser.ID;
    vm.adminUserName = SelectedAdminUser.Username;
    vm.adminUser = SelectedAdminUser;
    vm.adminGroupsAvailable = AdminGroupsAvailable.Items;
    vm.adminUser.UserGroupID = (CurrentGroups.Items.length > 0) ? CurrentGroups.Items[0].UserGroupID : null;
    vm.WeirGroup = [{id: 1, label: 'WVCUK'}, {id: 2, label: 'WPIFR'}];
    if(!(vm.adminUser.xp && vm.adminUser.xp.WeirGroup)){
        vm.adminUser.xp = {};
        vm.adminUser.xp.WeirGroup = {};
    }
    vm.oldGroupId = vm.adminUser.UserGroupID;

    if (vm.adminUser.TermsAccepted != null) {
        vm.adminUser.TermsAccepted = true;
    }

    vm.Submit = function () {
        OrderCloud.AdminUsers.Update(adminuserid, vm.adminUser)
            .then(function (user) {
                AdminGroupService.UpdateAdminGroup(user.ID, vm.oldGroupId, vm.adminUser.UserGroupID)
                .then(function () {
                    $state.go('adminUsers', {}, { reload: true });
                    toastr.success('User Updated', 'Success');
                });
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };

    vm.Delete = function() {
        OrderCloud.AdminUsers.Delete(adminuserid)
            .then(function() {
                $state.go('adminUsers', {}, {reload: true});
                toastr.success('User Deleted', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };
}

function AdminUserCreateController(AdminGroupService, $exceptionHandler, $state, toastr, OrderCloud, AdminGroupsAvailable) {
    var vm = this;
    vm.adminUser = {Email: '', Password: '', UserGroupID: '', Active: false, TermsAccepted: false};
    vm.adminGroupsAvailable = AdminGroupsAvailable.Items;
    vm.WeirGroup = [{id: 1, label: 'WVCUK'}, {id: 2, label: 'WPIFR'}];

    vm.Submit = function() {
        vm.adminUser.TermsAccepted = new Date();
        OrderCloud.AdminUsers.Create(vm.adminUser)
            .then(function (user) {
                AdminGroupService.UpdateAdminGroup(user.ID, null, vm.adminUser.UserGroupID)
                .then(function () {
                    $state.go('adminUsers', {}, { reload: true });
                    toastr.success('User Created', 'Success');
                });
            })
            .catch(function (ex) {
                $exceptionHandler(ex)
            });
    };
}
