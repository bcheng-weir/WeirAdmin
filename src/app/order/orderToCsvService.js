angular.module('orderCloud')
    .service('OrderToCsvService', OrderToCsvService);

function OrderToCsvService($filter,$sce,OCGeography,Underscore) {
	function country (c) {
		var result = Underscore.findWhere(OCGeography.Countries, { value: c });
		return result ? result.label : '';
	}
    function ToCsvJson(Order, LineItems, DeliveryAddress, Payments, Labels) {
        var payment = null;
        if (Payments && Payments.length) {
            payment = Payments[0];
        }

        angular.forEach(Labels, function(value, key) {
            var result =  $sce.getTrustedHtml(value);
            if (result !== "[object Object]") {
                result = result.toString().replace(/&eacute;/g, 'é').replace(/&egrave;/g, 'è');
                Labels[key] = result;
            }
        });
        var data = [
            [Labels.status, Order.xp.Status],
            [Labels.WeirOrderNo, Order.ID],
            [Labels.QuoteRef, (Order.xp && Order.xp.RefNum ? Order.xp.RefNum : "")],
            [Labels.PONumber, (payment && payment.xp && payment.xp.PONumber ? payment.xp.PONumber : "")],
            ["", ""],
            [Labels.SerialNum, Labels.TagNum, Labels.PartNum, Labels.Description, Labels.RecReplacement, Labels.LeadTimeAvailability, Labels.Currency, Labels.PricePerItem, Labels.Quantity]
        ];

        var currency = (Order.FromCompanyID.substr(0,5) == "WVCUK") ? ("£") : ((Order.FromCompanyID.substr(0,5) == "WPIFR") ? ("€") : (""));

        angular.forEach(LineItems, function (item) {
            var line = [];
            line.push((item.xp.SN) ? item.xp.SN : "");
            line.push((item.xp.TagNumber) ? item.xp.TagNumber : "");
            line.push((item.xp.ProductName) ? item.xp.ProductName : item.Product.Name);
            line.push((item.xp.Description) ? item.xp.Description : item.Product.Description);
            line.push((item.xp.ReplacementSchedule) ? item.xp.ReplacementSchedule : item.Product.xp.ReplacementSchedule);
            line.push((item.xp.LeadTime) ? item.xp.LeadTime : item.Product.xp.LeadTime);
            line.push(currency);
            line.push(item.UnitPrice);
            line.push(item.Quantity);
            data.push(line);
        });
        data.push(["","","",Order.xp.ShippingDescription,"","",currency,Order.ShippingCost,""]);
        data.push(["", "", "", "", "", Labels.Total, currency[Order.xp.BuyerID.substring(0,5)], Order.Total]);
        data.push(["", ""]);
        data.push([Labels.DeliveryAddress]);
	    if (DeliveryAddress) {
		    if(DeliveryAddress.Country=="GB") {
			    data.push([DeliveryAddress.FirstName + " " + DeliveryAddress.LastName, ""]);
			    data.push([DeliveryAddress.CompanyName]);
			    data.push([DeliveryAddress.Street1]);
                DeliveryAddress.Street2 ? data.push([DeliveryAddress.Street2]) : null;
                DeliveryAddress.xp.Street3 ? data.push([DeliveryAddress.xp.Street3]) : null;
			    data.push([DeliveryAddress.City]);
			    data.push([DeliveryAddress.Zip]);
			    data.push([country(DeliveryAddress.Country)]);
		    } else if (DeliveryAddress.Country=="FR") {
			    data.push([DeliveryAddress.FirstName + " " + DeliveryAddress.LastName, ""]);
			    data.push([DeliveryAddress.CompanyName]);
			    data.push([DeliveryAddress.Street1]);
                DeliveryAddress.Street2 ? data.push([DeliveryAddress.Street2]) : null;
                DeliveryAddress.xp.Street3 ? data.push([DeliveryAddress.xp.Street3]) : null;
			    data.push([DeliveryAddress.Zip, "", DeliveryAddress.City]);
			    data.push([country(DeliveryAddress.Country)]);
		    }
	    }

	    data.push(["", ""]);
	    data.push([Labels.Comments]);
	    angular.forEach(Order.xp.CommentsToWeir, function(comment) {
		    data.push(["",comment.by,$filter('weirdate')(comment.date)]);
		    data.push(["","",comment.val]);
	    });

        return data;
    }
    var service = {
        ToCsvJson: ToCsvJson
    };
    return service;
}
