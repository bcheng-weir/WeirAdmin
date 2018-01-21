angular.module('orderCloud')
    .config(UsersConfig)
    .factory('UserService', UserService)
    .controller('UsersCtrl', UsersController)
    .controller('UserEditCtrl', UserEditController)
    .controller('UserCreateCtrl', UserCreateController)
;

function UserService($q, $state, OrderCloudSDK) {
    var _userTypes = [{ value: 1, label: "Buyer" }, { value: 2, label: "Shopper" }];

    function _updateUserGroup(buyerID, userID, oldGroupID, newGroupID) {
        var d = $q.defer();
        if (oldGroupID) {
            if (newGroupID && (newGroupID != oldGroupID)) {
                OrderCloudSDK.UserGroups.DeleteUserAssignment(buyerID, oldGroupID, userID)
                .then(function () {
                    OrderCloudSDK.UserGroups.SaveUserAssignment(buyerID, { UserGroupID: newGroupID, UserID: userID })
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
            OrderCloudSDK.UserGroups.SaveUserAssignment(buyerID, { UserGroupID: newGroupID, UserID: userID })
            .then(function () {
                d.resolve();
            })
            .catch(function (ex) {
                d.reject(ex);
            });
        }
        return d.promise;
    }

    return {
        UserTypes: _userTypes,
        UpdateGroup: _updateUserGroup
    };
}

function UsersConfig($stateProvider) {
    $stateProvider
        .state('users', {
            parent: 'base',
            templateUrl: 'users/templates/users.tpl.html',
            controller: 'UsersCtrl',
            controllerAs: 'users',
            url: '/users?from&to&search&page&pageSize&searchOn&sortBy&filters',
            data: {componentName: 'Users'},
            resolve: {
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                UserList: function(OrderCloudSDK, Parameters, CurrentBuyer) {
                    var opts = {
                        search: Parameters.search,
                        searchOn: Parameters.searchOn,
                        sortBy: Parameters.sortBy,
                        page: Parameters.page,
                        pageSize: Parameters.pageSize || 12,
                        filters: Parameters.filters
                    };
                    return OrderCloudSDK.Users.List(CurrentBuyer.GetBuyerID(), opts);
                }
            }
        })
        .state('users.edit', {
            url: '/:userid/edit',
            templateUrl: 'users/templates/userEdit.tpl.html',
            controller: 'UserEditCtrl',
            controllerAs: 'userEdit',
            resolve: {
                SelectedUser: function($stateParams, OrderCloudSDK, CurrentBuyer) {
                    return OrderCloudSDK.Users.Get(CurrentBuyer.GetBuyerID() , $stateParams.userid);
                },
                GroupsAvailable: function (OrderCloudSDK, CurrentBuyer) {
                    return OrderCloudSDK.UserGroups.List(CurrentBuyer.GetBuyerID());
                },
                CurrentGroups: function ($stateParams, OrderCloudSDK, CurrentBuyer) {
                    return OrderCloudSDK.UserGroups.ListUserAssignments(CurrentBuyer.GetBuyerID())//, $stateParams.userid)
                }
            }
        })
        .state('users.create', {
            url: '/create',
            templateUrl: 'users/templates/userCreate.tpl.html',
            controller: 'UserCreateCtrl',
            controllerAs: 'userCreate',
            resolve: {
                GroupsAvailable: function (OrderCloudSDK, CurrentBuyer) {
                    return OrderCloudSDK.UserGroups.List(CurrentBuyer.GetBuyerID());
                }
            }
        })
    ;
}

function UsersController($state, $ocMedia, OrderCloudSDK, OrderCloudParameters, UserList, Parameters, CurrentBuyer) {
    var vm = this;
    vm.list = UserList;
    vm.parameters = Parameters;
    vm.sortSelection = Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;

    //Check if filters are applied
    vm.filtersApplied = vm.parameters.filters || vm.parameters.from || vm.parameters.to || ($ocMedia('max-width:767px') && vm.sortSelection); //Sort by is a filter on mobile devices
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
        vm.parameters.from = null;
        vm.parameters.to = null;
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
        var opts= {
            search: Parameters.search,
            searchOn: Parameters.searchOn,
            sortBy: Parameters.sortBy,
            page: Parameters.page,
            pageSize: Parameters.pageSize || vm.list.Meta.PageSize,
            filters: Parameters.filters
        };
        return OrderCloudSDK.Users.List(CurrentBuyer.GetBuyerID(), opts)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };
}

function UserEditController($exceptionHandler, $state, $scope, toastr, OrderCloudSDK, SelectedUser, GroupsAvailable, CurrentGroups, UserService, CurrentBuyer) {
    var vm = this,
        userid = SelectedUser.ID;
    vm.userName = SelectedUser.Username;
    vm.user = SelectedUser;
    vm.groupsAvailable = GroupsAvailable.Items;
    vm.user.UserGroupID = (CurrentGroups.Items.length > 0) ? CurrentGroups.Items[0].UserGroupID : null;
    vm.oldGroupId = vm.user.UserGroupID;

    vm.groupsAvailable = GroupsAvailable.Items;
    vm.userTypes = UserService.UserTypes;
    if (vm.user.TermsAccepted != null) {
        vm.TermsAccepted = true;
    }

    vm.Submit = function() {
        var today = new Date();
        vm.user.TermsAccepted = today;

        //TODO - only include updated fields
        var opts = {
            'ID':vm.user.ID,
            'FirstName':vm.user.FirstName,
            'LastName':vm.user.LastName,
            'Phone':vm.user.Phone,
            'Email':vm.user.Email,
            'UserGroupID':vm.groupsAvailable[vm.user.UserGroupID],
            'Active':vm.user.Active,
            'TermsAccepted':vm.user.TermsAccepted,
            'xp': {
                'type':vm.user.xp.type
            }
        }; //Will replace vm.user below.
        if ($scope.UserEditForm.userPasswordInput.$dirty) {
            opts.Password = vm.user.Password;
        }

        OrderCloudSDK.Users.Patch(CurrentBuyer.GetBuyerID(), userid, opts)
            .then(function (user) {
                UserService.UpdateGroup(CurrentBuyer.GetBuyerID(), user.ID, vm.oldGroupId, vm.user.UserGroupID)
                .then(function () {
                    $state.go('users', {}, { reload: true });
                    toastr.success('User Updated', 'Success');
                });
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };

    vm.Delete = function() {
        OrderCloudSDK.Users.Delete(CurrentBuyer.GetBuyerID(), userid)
            .then(function() {
                $state.go('users', {}, {reload: true});
                toastr.success('User Deleted', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };
}

function UserCreateController($exceptionHandler, $state, toastr, OrderCloudSDK, GroupsAvailable, UserService, CurrentBuyer) {
    var vm = this;
    vm.user = {
        Active: false,
        Email: '',
        Password: '',
        UserGroupID: '',
        xp: {}
    };
    vm.groupsAvailable = GroupsAvailable.Items;
    vm.languageOptions = UserService.Languages;
    vm.userTypes = UserService.UserTypes;

    vm.Submit = function() {
        vm.user.TermsAccepted = new Date();
        vm.user.Username = vm.user.Email;
        OrderCloudSDK.Users.Create(CurrentBuyer.GetBuyerID(), vm.user)
            .then(function (user) {
                UserService.UpdateGroup(CurrentBuyer.GetBuyerID(), user.ID, null, vm.user.UserGroupID)
                .then(function() {
                    $state.go('users', {}, {reload: true});
                    toastr.success('User Created', 'Success');
                });
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };
}
