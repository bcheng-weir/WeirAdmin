angular.module('orderCloud')
    .service('OrderToCsvService', OrderToCsvService);

function OrderToCsvService($sce, WeirService) {
    function ToCsvJson(Order, LineItems, DeliveryAddress, Payments, Labels) {
        var payment = null;
        if (Payments && Payments.length) {
            payment = Payments[0];
        }
        var data = [
            [Labels.status, Order.xp.Status],
            [Labels.WeirOrderNo, Order.ID],
            [Labels.QuoteRef, (Order.xp && Order.xp.RefNum ? Order.xp.RefNum : "")],
            [Labels.PONumber, (payment && payment.xp && payment.xp.PONumber ? payment.xp.PONumber : "")],
            ["", ""],
            [Labels.SerialNum, Labels.TagNum, Labels.PartNum, Labels.Description, Labels.RecReplacement, Labels.LeadTimeAvailability, Labels.PricePerItem, Labels.Quantity]
        ];
        angular.forEach(LineItems.Items, function (item) {
            var line = [];
            line.push((item.xp.SN) ? item.xp.SN : "");
            line.push((item.xp.TagNumber) ? item.xp.TagNumber : "");
            line.push((item.Product.Name) ? item.Product.Name : "");
            line.push((item.Product.Description) ? item.Product.Description : "");
            line.push((item.Product.xp.ReplacementSchedule) ? item.Product.xp.ReplacementSchedule : "");
            line.push((item.Product.xp.LeadTime) ? item.Product.xp.LeadTime : "");
            line.push(item.UnitPrice);
            line.push(item.Quantity);
            data.push(line);
        });
        data.push(["", "", "", "", "", "", Labels.Total, Order.Total]);
        data.push(["", ""]);
        data.push([Labels.DelieveryAddress, "", "", Labels.YourComments]);
        data.push([DeliveryAddress.FirstName + " " + DeliveryAddress.LastName, "", "", Order.xp.CommentsToWeir]);
        data.push([DeliveryAddress.CompanyName]);
        data.push([DeliveryAddress.Street1]);
        data.push([DeliveryAddress.Street2]);
        data.push([DeliveryAddress.City]);

        return data;
    }
    var service =
        {
            ToCsvJson: ToCsvJson
        };
    return service;
}
