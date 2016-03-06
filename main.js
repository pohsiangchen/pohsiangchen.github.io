$.ajaxSetup({async: false});

var map, points, info, bounds, data, codes = {}, meta, currentDate, loadedData = {};
var dateBegin = new Date('2015-11-16'), dateEnd, firstCsv = true, selectedPoint = null;
var standards = {}, markers = {}, markerClicked = false, xlsxUrl ='';
var workbook, sheetPAMS, sheetUAT;
var tableContent = '';

$.getJSON('data/sampleList.json', {}, function (p) {
    points = p;
});

function initialize() {

    currentDate = new Date();
    $('input#selectDate').val(getDateStr(currentDate));

    var showChart = function (theDay, factoryId) {
        var dirtyDate = new Date(theDay);
        if (!isNaN(dirtyDate.getTime())) {
            currentDate = dirtyDate;
            if (markers[factoryId]) {
                new google.maps.event.trigger(markers[factoryId], 'click');
            }
        }
    };
    var routes = {
        '/:theDay/:factoryId': showChart
    };
    var router = Router(routes);

    /*map setting*/
    $('#map-canvas').height(window.outerHeight / 2.2);

    map = new google.maps.Map(document.getElementById('map-canvas'), {
        zoom: 12,
        center: {lat: 22.672925, lng: 120.309465}
    });
    info = new google.maps.InfoWindow();
    bounds = new google.maps.LatLngBounds();

    var pointSelectOptions = '<option value="">---請選擇---</option>';
    $.each(points, function (k, p) {
        var geoPoint = (new google.maps.LatLng(parseFloat(p.Lat), parseFloat(p.Lng)));
        var marker = new google.maps.Marker({
            position: geoPoint,
            map: map,
            title: p.name
        });
        marker.data = p;
        marker.addListener('click', function () {
            var infoText = '<strong>' + this.data.name + '</strong>';                        
            info.setContent(infoText);
            info.open(map, this);
            map.setZoom(15);
            map.setCenter(this.getPosition());            
            selectedPoint = this.data;
            currentDate = moment(selectedPoint.latest, "YYYYMMDD").toDate();      
            updateData();
        });
        markers[p['id']] = marker;
        bounds.extend(geoPoint);

        pointSelectOptions += '<option value="' + p.id + '">' + p.name + '[' + p.id + ']</option>';
    });
    $('#pointSelect').html(pointSelectOptions).select2();
    $('#pointSelect').change(function () {
        if (false === markerClicked) {
            var value = $(this).val();
            if (markers[value]) {
                new google.maps.event.trigger(markers[value], 'click');
            }
        }
    });

    map.fitBounds(bounds);
    router.init();

    $('a.bounds-reset').click(function () {
        map.fitBounds(bounds);
        return false;
    });

    $('a#btnPrevious').click(function () {       
        if (selectedPoint) {
            if (markers[parseInt(selectedPoint.id) - 1] && selectedPoint) {
               new google.maps.event.trigger(markers[parseInt(selectedPoint.id) - 1], 'click');
            }
        }         
        return false;
    });

    $('a#btnNext').click(function () {
        if (selectedPoint) {
            if (markers[parseInt(selectedPoint.id) + 1]) {
                new google.maps.event.trigger(markers[parseInt(selectedPoint.id) + 1], 'click');
            }
        }        
        return false;
    });

    $('input#selectDate').datepicker({
        dateFormat: 'yy-mm-dd',
        onSelect: function (txt) {
            var selectedDate = moment(txt, "YYYY-MM-DD").toDate();
            dateEnd = moment(selectedPoint.latest, "YYYYMMDD").toDate(); 
            if (selectedDate.getTime() === dateEnd.getTime()) {
                currenutDate = selectedDate;
                updateData();
            } else {                
                $(".no-result").show();
                $(".result").hide();
            }

        }
    });
    
    $('#tablist a').click(function (e) {
        e.preventDefault()
        $(this).tab('show')
    });        

    function updateData() {
        if (!selectedPoint) {
            return;
        }
        var date = getDateStr(currentDate);        
        $('input#selectDate').val(date);

        xlsxUrl = 'data/' + date.replace(/-/g, '') + '_' + selectedPoint.name + '.xlsx';            
        
        if (selectedPoint) {
            $(".no-result").hide();
            $(".result").show();
            
            showData(selectedPoint.id);
            window.location.hash = '#' + date + '/' + selectedPoint.id;
            $('#title').html(markers[selectedPoint.id].data.name);

            markerClicked = true;
            $('#pointSelect').val(selectedPoint.id).trigger('change');
            markerClicked = false;
        }
    }    

    function showData(currentKey) {
        $('#tab-block').show();
        var contentText = '';                        
        var titleText = markers[currentKey].data.name;          

        var oReq = new XMLHttpRequest();
        oReq.open("GET", xlsxUrl, true);
        oReq.responseType = "arraybuffer";

        oReq.onload = function(e) {
            var arraybuffer = oReq.response;

            /* convert data to binary string */
            var data = new Uint8Array(arraybuffer);
            var arr = new Array();
            for(var i = 0; i != data.length; ++i) arr[i] = String.fromCharCode(data[i]);
            var bstr = arr.join("");

            /* Call XLSX */
            workbook = XLSX.read(bstr, {type:"binary"});                        

            /* Get worksheet */
            sheetPAMS = workbook.Sheets['PAMS'];
            sheetUAT = workbook.Sheets['UAT'];

            /* Setting table content */
            // PAMS table
            content = '';            
            content += '<tr><td>' + sheetPAMS['A5'].v + '</td><td>' + sheetPAMS['B5'].v + '</td></tr>';
            content += '<tr><td>' + sheetPAMS['A6'].v + '</td><td>' + sheetPAMS['B6'].v + '</td></tr>';
            content += '<tr><td>' + sheetPAMS['A7'].v + '</td><td>' + sheetPAMS['B7'].v + '</td></tr>';
            content += '<tr><td>' + sheetPAMS['A8'].v + '</td><td>' + sheetPAMS['B8'].v + '</td></tr>';
            content += '<tr><td>' + sheetPAMS['A9'].v + '</td><td>' + sheetPAMS['B9'].v + '</td></tr>';
            content += '<tr><td>' + sheetPAMS['A10'].v + '</td><td>' + sheetPAMS['B10'].v + '</td></tr>';
            content += '<tr><td>' + sheetPAMS['C5'].v + '</td><td>' + sheetPAMS['D5'].v + '</td></tr>';
            content += '<tr><td>' + sheetPAMS['C6'].v + '</td><td>' + sheetPAMS['D6'].v + '</td></tr>';
            content += '<tr><td>' + sheetPAMS['C7'].v + '</td><td>' + sheetPAMS['D7'].v + '</td></tr>';
            content += '<tr><td>' + sheetPAMS['C8'].v + '</td><td>' + sheetPAMS['D8'].v + '</td></tr>';
            content += '<tr><td>' + sheetPAMS['C9'].v + '</td><td>' + sheetPAMS['D9'].v + '</td></tr>';            
            $('#pams .data-info').html(content);

            content = '';
            for (i = 12; i <= 62; i++) { 
                content += '<tr><td>' + sheetPAMS['A' + i].v + '</td><td>' + sheetPAMS['B' + i].v + '</td><td>' + sheetPAMS['C' + i].v + 
                        '</td><td>' + sheetPAMS['D' + i].v + '</td><td>' + sheetPAMS['E' + i].v + '</td></tr>';
            }
            $('#pams .data-list tbody').html(content);
            // end PAMS table 

            // UAT table
            content = '';            
            content += '<tr><td>' + sheetUAT['A5'].v + '</td><td>' + sheetUAT['B5'].v + '</td></tr>';
            content += '<tr><td>' + sheetUAT['A6'].v + '</td><td>' + sheetUAT['B6'].v + '</td></tr>';
            content += '<tr><td>' + sheetUAT['A7'].v + '</td><td>' + sheetUAT['B7'].v + '</td></tr>';
            content += '<tr><td>' + sheetUAT['A8'].v + '</td><td>' + sheetUAT['B8'].v + '</td></tr>';
            content += '<tr><td>' + sheetUAT['A9'].v + '</td><td>' + sheetUAT['B9'].v + '</td></tr>';
            content += '<tr><td>' + sheetUAT['A10'].v + '</td><td>' + sheetUAT['B10'].v + '</td></tr>';
            content += '<tr><td>' + sheetUAT['C5'].v + '</td><td>' + sheetUAT['D5'].v + '</td></tr>';
            content += '<tr><td>' + sheetUAT['C6'].v + '</td><td>' + sheetUAT['D6'].v + '</td></tr>';
            content += '<tr><td>' + sheetUAT['C7'].v + '</td><td>' + sheetUAT['D7'].v + '</td></tr>';
            content += '<tr><td>' + sheetUAT['C8'].v + '</td><td>' + sheetUAT['D8'].v + '</td></tr>';
            content += '<tr><td>' + sheetUAT['C9'].v + '</td><td>' + sheetUAT['D9'].v + '</td></tr>';            
            $('#uat .data-info').html(content);

            content = '';
            for (i = 12; i <= 57; i++) { 
                content += '<tr><td>' + sheetUAT['A' + i].v + '</td><td>' + sheetUAT['B' + i].v + '</td><td>' + sheetUAT['C' + i].v + 
                        '</td><td>' + sheetUAT['D' + i].v + '</td><td>' + sheetUAT['E' + i].v + '</td></tr>';
            }
            $('#uat .data-list tbody').html(content);
            // end UAT table 

        }
        oReq.send();        
    }

    function getDateStr(dateObj) {
        var m = dateObj.getMonth() + 1;
        var d = dateObj.getDate();
        m = m.toString();
        d = d.toString();
        m = m.length > 1 ? m : '0' + m;
        d = d.length > 1 ? d : '0' + d;
        return dateObj.getFullYear() + '-' + m + '-' + d;
    }
}

google.maps.event.addDomListener(window, 'load', initialize);