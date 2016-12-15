angular.module('orderCloud')
    .config(LoginConfig)
    .factory('LoginService', LoginService)
    .controller('LoginCtrl', LoginController)
;

function LoginConfig($stateProvider) {
    $stateProvider
        .state('login', {
            url: '/login/:token',
            templateUrl: 'login/templates/login.tpl.html',
            controller: 'LoginCtrl',
            controllerAs: 'login'
        })
    ;
}

function LoginService($q, $window, $state, toastr, OrderCloud, TokenRefresh, clientid, buyerid, anonymous, appname, $localForage) {
    return {
        SendVerificationCode: _sendVerificationCode,
        ResetPassword: _resetPassword,
        RememberMe: _rememberMe,
        GetUsername: _getUsername,
        SetUsername: _setUsername,
        Logout: _logout,
        RouteAfterLogin: _routeAfterLogin
    };

    function _routeAfterLogin() {
        var storageName = appname + '.routeto';
        $localForage.getItem(storageName)
        .then(function (rte) {
            $localForage.removeItem(storageName);
            if (rte && rte.state) {
                if (rte.state == 'gotoOrder' && rte.id && rte.buyer) {
                    $state.go('gotoOrder', { orderID: rte.id, buyerID: rte.buyer });
                } else {
                    $state.go('home');
                }
            } else {
                $state.go('home');
            }
        })
        .catch(function () {
            $state.go('home');
        });
    }

    function _sendVerificationCode(email) {
        var deferred = $q.defer();

        var passwordResetRequest = {
            Email: email,
            ClientID: clientid,
            URL: encodeURIComponent($window.location.href) + '{0}'
        };

        OrderCloud.PasswordResets.SendVerificationCode(passwordResetRequest)
            .then(function() {
                deferred.resolve();
            })
            .catch(function(ex) {
                deferred.reject(ex);
            });

        return deferred.promise;
    }

    function _resetPassword(resetPasswordCredentials, verificationCode) {
        var deferred = $q.defer();

        var passwordReset = {
            ClientID: clientid,
            Username: resetPasswordCredentials.ResetUsername,
            Password: resetPasswordCredentials.NewPassword
        };

        OrderCloud.PasswordResets.ResetPassword(verificationCode, passwordReset).
            then(function() {
                deferred.resolve();
            })
            .catch(function(ex) {
                deferred.reject(ex);
            });

        return deferred.promise;
    }

    function _logout(){
        OrderCloud.Auth.RemoveToken();
        OrderCloud.Auth.RemoveImpersonationToken();
        OrderCloud.BuyerID.Set(null);
        TokenRefresh.RemoveToken();
        $state.go(anonymous ? 'home' : 'login', {}, {reload: true});
    }

    function _rememberMe() {
        TokenRefresh.GetToken()
            .then(function (refreshToken) {
                if (refreshToken) {
                    TokenRefresh.Refresh(refreshToken)
                        .then(function(token) {
                            OrderCloud.BuyerID.Set(buyerid);
                            OrderCloud.Auth.SetToken(token.access_token);
                            _routeAfterLogin();
                        })
                        .catch(function () {
                            toastr.error('Your token has expired, please log in again.');
                        });
                } else {
                    _logout();
                }
            });
    }

	function _setUsername(username) {
		$localForage.setItem('username',username);
	}

	function _getUsername() {
		var dfd = $q.defer();
		$localForage.getItem('username')
			.then(function(username) {
				dfd.resolve(username);
			});
		return dfd.promise;
	}
}

function LoginController($stateParams, $exceptionHandler, OrderCloud, LoginService, TokenRefresh, buyerid) {
    var vm = this;
	var username = null;
	LoginService.GetUsername()
		.then(function(myUsername) {
			console.log('My User Name: ' + myUsername);
			username = myUsername;
			vm.credentials = {
				Username: username,
				Password: null
			};
			vm.rememberStatus = username ? true : false;
		});
    /*vm.credentials = {
        Username: null,
        Password: null
    };*/
    vm.token = $stateParams.token;
    vm.form = vm.token ? 'reset' : 'login';
    vm.setForm = function(form) {
        vm.form = form;
    };
    //vm.rememberStatus = false;

    vm.submit = function() {
        OrderCloud.Auth.GetToken(vm.credentials)
            .then(function(data) {
                //vm.rememberStatus ? TokenRefresh.SetToken(data['refresh_token']) : angular.noop();
	            if(vm.rememberStatus) {
		            LoginService.SetUsername(vm.credentials.Username);
	            } else {
		            LoginService.SetUsername(null);
	            }
                OrderCloud.BuyerID.Set(buyerid);
                OrderCloud.Auth.SetToken(data['access_token']);
                LoginService.RouteAfterLogin();
            })
            .catch(function(ex) {
                if(ex.data.error == "Username not found or password incorrect.") {
                    ex.data.error = "We are not able to recognise the email or password entered. Please check and re-enter.";
                }
                $exceptionHandler(ex);
            });
    };

    vm.forgotPassword = function() {
        LoginService.SendVerificationCode(vm.credentials.Email)
            .then(function() {
                vm.setForm('verificationCodeSuccess');
                vm.credentials.Email = null;
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };

    vm.resetPassword = function() {
        LoginService.ResetPassword(vm.credentials, vm.token)
            .then(function() {
                vm.setForm('resetSuccess');
                vm.token = null;
                vm.credentials.ResetUsername = null;
                vm.credentials.NewPassword = null;
                vm.credentials.ConfirmPassword = null;
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
                vm.credentials.ResetUsername = null;
                vm.credentials.NewPassword = null;
                vm.credentials.ConfirmPassword = null;
            });
    };
}