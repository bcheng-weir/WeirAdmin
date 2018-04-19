angular.module('orderCloud')
	.factory('BackToListService', BackToList);

function BackToList($state) {
	var goHere = {
		destination: 'ordersMain.default',
		filters: {"xp.Type":null,"xp.Active":true,"xp.Archive":"!true"}
	};

	function _goToLocation() {
		var filter = goHere.filters;
		$state.go(goHere.destination, {filters:filter},{reload:true});
	}

	function _getLocation() {
		return goHere;
	}

	function _generateLocation(f, fP) {
		if (f.parent == 'ordersMain') {
			goHere = {
				destination: f.name,
				filters: fP.filters
			};
		}
	}

	var svc = {
		GenerateLocation:_generateLocation,
		GetLocation: _getLocation,
		GoToLocation: _goToLocation
	};
	return svc;
}