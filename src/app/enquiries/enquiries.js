angular.module('orderCloud')
    .config(EnquiriesConfig)
    .controller('EnquiriesCtrl', EnquiriesController);

function EnquiriesConfig($stateProvider) {
    $stateProvider
        .state('enquiries', {
            parent: 'base',
            templateUrl: 'enquiries/templates/enquiries.tpl.html',
            controller: 'EnquiriesCtrl',
            controllerAs: 'enquiries',
            url: '/EnquiryAdministration',
            date: { componentName: 'Enquiries' },
            resolve: {
                EnquiryCategories: function(OrderCloudSDK) {
                    var opts = {
                        'depth': 2,
                        'filters': {
                            'ID': '<>Parts',
                            'ChildCount': '0'
                        }
                    };

                    return OrderCloudSDK.Categories.List('WPIFR_ENQ', opts);
                }
            }
        });
}

function EnquiriesController($exceptionHandler, EnquiryCategories, OrderCloudSDK, toastr) {
    var vm = this;
    vm.list = EnquiryCategories.Items;

    vm.Save = function(category) {
        var opts = {
            'xp': {
                'en': {
                    'Name': category.xp.en.Name
                }
            }
        };

        OrderCloudSDK.Categories.Patch('WPIFR_ENQ', category.ID, opts)
            .then(function(category) {
                toastr.success(category.xp.en.Name, 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };
}