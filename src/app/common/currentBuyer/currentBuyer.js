angular.module('orderCloud')
	.service('CurrentBuyer',CurrentBuyer);

function CurrentBuyer($cookies,appname) {
	var service = {
		Profile: null,
		Org: null,
		SetBuyerID: _SetID,
		GetBuyerID: _GetID
	};

	function _SetID(value) {
		$cookies.put(appname + '.buyerID', value);
	}

	function _GetID() {
		return $cookies.get(appname + '.buyerID');
	}

	return service;
}
