angular.module('orderCloud')
    .config(BaseConfig)
    .controller('BaseCtrl', BaseController)
    .controller('FeedbackCtrl', FeedbackController)
    .filter('occomponents', occomponents)
;

function BaseConfig($stateProvider, $injector, $sceDelegateProvider) {
	$sceDelegateProvider.resourceUrlWhitelist([
		'self',
		'https://www.global.weir/brands/**',
		'https://**.herokuapp.com/**',
		'https://s3.us-east-2.amazonaws.com/ordercloudtest/**',
		'https://s3.eu-west-2.amazonaws.com/ordercloudfiles/**'
	]);

    var baseViews = {
        '': {
            templateUrl: 'base/templates/base.tpl.html',
            controller: 'BaseCtrl',
            controllerAs: 'base'
        }
    };

    if ($injector.has('base')) {
        var baseConfig = $injector.get('base');

        //conditional base left
        baseConfig.left ? baseViews['left@base'] = {
            'templateUrl': 'base/templates/base.left.tpl.html'
        } : angular.noop();

        //conditional base right
        baseConfig.right ? baseViews['right@base'] = {
            'templateUrl': 'base/templates/base.right.tpl.html'
        } : angular.noop();

        //conditional base top
        baseConfig.top ? baseViews['top@base'] = {
            'templateUrl': 'base/templates/base.top.tpl.html'
        } : angular.noop();

        //conditional base bottom
        baseConfig.bottom ? baseViews['bottom@base'] = {
            'templateUrl': 'base/templates/base.bottom.tpl.html'
        } : angular.noop();
    }

    var baseState = {
        url: '',
        abstract: true,
        views: baseViews,
        resolve: {
            CurrentUser: function($q, $state, OrderCloudSDK, buyerid, anonymous, CurrentBuyer) {
                var dfd = $q.defer();
                OrderCloudSDK.Me.Get()
                    .then(function(data) {
                        dfd.resolve(data);
                    })
                    .catch(function(){
                        if (anonymous) {
                            if (!OrderCloudSDK.GetToken()) {
                                OrderCloudSDK.GetToken('')
                                    .then(function(data) {
                                        OrderCloudSDK.SetToken(data['access_token']);
                                    })
                                    .finally(function() {
                                        CurrentBuyer.SetBuyerID(buyerid);
                                        dfd.resolve({});
                                    });
                            }
                        } else {
                            OrderCloudSDK.RemoveToken();
                            OrderCloudSDK.RemoveImpersonationToken();
                            CurrentBuyer.SetBuyerID(null);
                            $state.go('login');
                            dfd.resolve();
                        }
                    });
                return dfd.promise;
            },
            AnonymousUser: function($q, OrderCloudSDK, CurrentUser) {
	            var tmp = OrderCloudSDK.GetToken();
                CurrentUser.Anonymous = (tmp) ? angular.isDefined(JSON.parse(atob(OrderCloudSDK.GetToken().split('.')[1])).orderid) : tmp;
            },
            ComponentList: function($state, $q, Underscore) {
                var deferred = $q.defer();
                var nonSpecific = ['Customers', 'CustomersShared','Orders', 'Buyers', 'Products', 'Specs', 'Price Schedules', 'Admin Users', 'Product Facets'];
                var components = {
                    nonSpecific: [],
                    buyerSpecific: []
                };
                angular.forEach($state.get(), function(state) {
                    if (!state.data || !state.data.componentName) return;
                    if (nonSpecific.indexOf(state.data.componentName) > -1) {
                        if (Underscore.findWhere(components.nonSpecific, {Display: state.data.componentName}) == undefined) {
                            components.nonSpecific.push({
                                Display: state.data.componentName,
                                StateRef: state.name
                            });
                        }
                    } else {
                        if (Underscore.findWhere(components.buyerSpecific, {Display: state.data.componentName}) == undefined) {
                            components.buyerSpecific.push({
                                Display: state.data.componentName,
                                StateRef: state.name
                            });
                        }
                    }
                });
                deferred.resolve(components);
                return deferred.promise;
            },
            IsAdmin: function(UserGroupsService) {
                return UserGroupsService.IsUserInGroup([UserGroupsService.Groups.SuperAdmin,UserGroupsService.Groups.DataLoader]);
            },
            IsInternalSales: function (UserGroupsService) {
                return UserGroupsService.IsUserInGroup([UserGroupsService.Groups.InternalSales]);
            }
        }
    };

    $stateProvider.state('base', baseState);
}

function BaseController($rootScope, $ocMedia, $state, $uibModal, Underscore, snapRemote, defaultErrorMessageResolver,
                        CurrentUser, ComponentList, base, WeirService, IsAdmin, BackToListService) {
    var vm = this;
    vm.left = base.left;
    vm.right = base.right;
    vm.currentUser = CurrentUser;
    vm.catalogItems = ComponentList.nonSpecific;
    vm.organizationItems = ComponentList.buyerSpecific;
    vm.IsAdmin = IsAdmin;
    vm.CanEditCustomers = IsAdmin; // || IsInternalSales; Based on call with Paul on 12/16.
    vm.registrationAvailable = Underscore.filter(vm.organizationItems, function (item) { return item.StateRef == 'registration' }).length;

    defaultErrorMessageResolver.getErrorMessages().then(function (errorMessages) {
        errorMessages['customPassword'] = 'Password must be at least eight characters long and include at least one letter and one number';
        errorMessages['positiveInteger'] = 'Please enter a positive integer';
        errorMessages['ID_Name'] = 'Only Alphanumeric characters, hyphens and underscores are allowed';
        errorMessages['confirmpassword'] = 'Your passwords do not match';
        errorMessages['noSpecialChars'] = 'Only Alphanumeric characters are allowed';
        errorMessages['customPhone'] = 'Only numbers, spaces and parenthesis are allowed';
        errorMessages['currencyError'] = 'Please enter a valid amount in the format ###0.00';
    });

    vm.snapOptions = {
        disable: (!base.left && base.right) ? 'left' : ((base.left && !base.right) ? 'right' : 'none')
    };

    var labels = {
        en: {
            admin: "Admin",
            customers: "Customers",
            sharedCustomers: "Shared Customers",
            orders: "Orders",
            archived: "Archived",
            standardDelivery: "Carriage",
            poPrintContent: "Fixed Print Content",
            sharedContent: "Shared Content",
            currencyRates: "Manage Currencies",
            OrdersAll: "All Quotes and Orders",
            QuotesRequested: "Quotes requested",
            QuotesConfirmed: "Confirmed quotes",
            QuotesDeleted: "Deleted quotes",
            OrdersDraft: "Draft orders",
            OrdersConfirmed: "Confirmed orders",
            OrdersDeleted: "Deleted orders",
        }
    };

    vm.labels = labels.en;

    function _isMobile() {
        return $ocMedia('max-width:991px');
    }

    function _initDrawers(isMobile) {
        snapRemote.close('MAIN');
        if (isMobile && (base.left || base.right)) {
            snapRemote.enable('MAIN');
        } else {
            snapRemote.disable('MAIN');
        }
    }

    _initDrawers(_isMobile());

    $rootScope.$watch(_isMobile, function(n, o) {
        if (n === o) return;
        _initDrawers(n);
    });

    vm.OrderAction = _actions;
    function _actions(action) {
        var filter = {
            "AllQuotesOrders":{"xp.Type":"Order|Quote","xp.Active":true,"xp.Archive":"!true"},
            "RequestedQuotes":{"xp.Type":"Quote","xp.Active":true,"xp.Archive":"!true","xp.Status":WeirService.OrderStatus.Enquiry.id + "|" + WeirService.OrderStatus.EnquiryReview.id + "|" + WeirService.OrderStatus.Submitted.id + "|" + WeirService.OrderStatus.RevisedQuote.id + "|" + WeirService.OrderStatus.RejectedQuote.id},
            "ConfirmedQuotes":{"xp.Type":"Quote","xp.Active":true,"xp.Archive":"!true","xp.Status":WeirService.OrderStatus.ConfirmedQuote.id},
            "DeletedQuotes":{"xp.Type":"Quote","xp.Active":true,"xp.Archive":"!true","xp.Status":WeirService.OrderStatus.Deleted.id},
            "DraftOrders":{"xp.Type":"Order","xp.Active":true,"xp.Archive":"!true","xp.Status":WeirService.OrderStatus.SubmittedPendingPO.id + "|" + WeirService.OrderStatus.RevisedOrder.id + "|" + WeirService.OrderStatus.RejectedRevisedOrder.id},
            "ConfirmedOrders":{"xp.Type":"Order","xp.Active":true,"xp.Archive":"!true","xp.Status":WeirService.OrderStatus.ConfirmedOrder.id + "|" + WeirService.OrderStatus.SubmittedWithPO.id + "|" + WeirService.OrderStatus.Despatched.id},
            "DeletedOrders":{"xp.Type":"Order","xp.Active":true,"xp.Archive":"!true","xp.Status":WeirService.OrderStatus.Deleted.id},
            "ArchivedOrders":{"xp.Type":"Order|Quote","xp.Active":true,"xp.Archive":true}
        };
        var destination = {
            "AllQuotesOrders":"ordersMain.ordersAll",
            "RequestedQuotes":"ordersMain.quotesRequested",
            "ConfirmedQuotes":"ordersMain.quotesConfirmed",
            "DeletedQuotes": "ordersMain.quotesDeleted",
            "DraftOrders":"ordersMain.ordersDraft",
            "ConfirmedOrders":"ordersMain.ordersConfirmed",
            "DeletedOrders":"ordersMain.ordersDeleted",
            "ArchivedOrders": "ordersMain.archived"
        };
        $state.go(destination[action], {filters:JSON.stringify(filter[action])},{reload:true});
    }

    vm.showFeedbackForm = function () {
        var modalInstance = $uibModal.open({
            animation: true,
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            templateUrl: 'base/templates/base.feedback.tpl.html',
            controller: 'FeedbackCtrl',
            controllerAs: 'feedback',
            size: 'sm',
            resolve: {
                User: function () {
                    return CurrentUser;
                }
            }
        });
        modalInstance.result;
    };

	$rootScope.$on('$stateChangeSuccess', function(ev, to, toParams, from, fromParams) {
		BackToListService.GenerateLocation(from, fromParams);
	});
}

function occomponents() {
    return function(components) {
        var filtered = ['registration'];
        var result = [];

        angular.forEach(components, function(component) {
            if (filtered.indexOf(component.StateRef) == -1) result.push(component);
        });

        return result;
    }
}


function FeedbackController($sce, $uibModalInstance, $state, OrderCloudSDK, WeirService, User) {
    var vm = this;
    vm.user = User;
    vm.Cancel = cancel;
    vm.Send = sendFeedback;
    var labels = {
        en: {
            title: "Please send us your feedback and suggestions",
            bugDefect: "Bug or error",
            suggestion: "Suggestion"
        },
        fr: {
            title: $sce.trustAsHtml("Please send us your feedback and suggestions"),
            bugDefect: $sce.trustAsHtml("Bug or error"),
            suggestion: $sce.trustAsHtml("Suggestion")
        }
    };
    vm.labels = WeirService.LocaleResources(labels);
    vm.typesOfFeedback = [
        { Label: "bug", Name: vm.labels.bugDefect },
        { Label: "suggestion", Name: vm.labels.suggestion }
    ];
    vm.type = "suggestion";

    function cancel() {
        $uibModalInstance.dismiss('cancel');
    }
    function sendFeedback() {
        var data = {
            xp: {
                feedback: {
                    from: vm.email,
                    type: vm.type,
                    content: vm.content,
                    time: (new Date()).toISOString(),
                    page: $state.current.name
                }
            }
        };
        var usr = vm.user;
        if (usr) {
            OrderCloudSDK.AdminUsers.Patch(usr.ID, data);
        }
        $uibModalInstance.close();
    }
}
