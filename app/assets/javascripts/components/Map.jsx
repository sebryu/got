'use strict';

// var React = require('react');
var PropTypes = React.PropTypes;

function setCoordsToArea(target, coords) {
  var bbox = target.getBBox();
  coords.x = Math.floor(bbox.x + bbox.width/2.0);
  coords.y = Math.floor(bbox.y + bbox.height/2.0);
  return true;
};

var Map = React.createClass({
  getDefaultProps() {
    var orders = [
      {id: 'order_march0', x: "250", y: "250", color: "red"},
      {id: 'order_march1', x: "350", y: "250", color: "red"},
      {id: 'order_defence0', x: "250", y: "350", color: "blue"},
      {id: 'order_defence1', x: "350", y: "350", color: "blue"},
      {id: 'order_support0', x: "250", y: "450", color: "orange"},
      {id: 'order_support1', x: "350", y: "450", color: "orange"},
      {id: 'order_raid0', x: "250", y: "550", color: "yellow"},
      {id: 'order_raid1', x: "350", y: "550", color: "yellow"},
      {id: 'order_consolidate0', x: "250", y: "650", color: "purple"},
      {id: 'order_consolidate1', x: "350", y: "650", color: "purple"},
    ];

    var units = {
      footmans: [
        { id: 'footman-0', area: 'karhold', color: "blue" },
        { id: 'footman-1', area: 'karhold', color: "blue" },
      ],
      knights: [
        { id: 'knight-0', area: 'karhold', color: "blue" },
        { id: 'knight-1', area: 'winterfell', color: "blue" },
      ],
      siege_engines: [
        { id: 'siege_engine-0', area: 'karhold', color: "blue" },
      ],
      ships: [

      ]
    };

    var connections = {
      karhold: ['castle_black', 'winterfell'],
      castle_black: ['karhold', 'winterfell'],
      winterfell: ['karhold', 'castle_black', 'the_stony_shore', 'white_harbor'],
      the_stony_shore: ['winterfell'],
      white_harbor: ['winterfell', 'widows_watch'],
      widows_watch: ['white_harbor'],
    };

    var areaCoordsAdjust = {
      white_harbor: { x: -70, y: -20},
    };

    return {
      orders,
      units,
      connections,
      areaCoordsAdjust,
    };
  },

  getInitialState() {
    return {
      clickedElement: null,
      mapOrders: {},
      playerAreas: ['karhold', 'winterfell'],
      orders: _.cloneDeep(this.props.orders),
      units: _.cloneDeep(this.props.units),
      connections: _.cloneDeep(this.props.connections),
    };
  },

  componentDidMount() {
    // debugger;
    var propsUnits = this.state.units;
    _.map(propsUnits, units => {
      _.map(units, unit => {
        var area = this.refs[unit.area];
        var coords = {};
        setCoordsToArea(area, coords);
        unit.x = coords.x;
        unit.y = coords.y;
      });
    });
    console.log(propsUnits);
    this.setState({
      units: propsUnits,
    });
  },

  toggleClass(element, klass) {
    if (element.classList[0] == klass) {
      element.classList.remove(klass);
    } else {
      element.classList.add(klass);
    }
  },

  highlightElement(element) {
    this.toggleClass(element, 'active');
    // var klass = 'active';
    // if (element.classList[0] != klass) {
    //   element.classList.add(klass);
    // }
  },

  unhighlightElement(element) {
    var klass = 'active';
    if (element.classList[0] == klass) {
      element.classList.remove(klass);
    }
  },

  elementClicked(element) {
    var prev = this.state.clickedElement;
    this.highlightElement(element);
    if (prev && prev != element) {
      this.unhighlightElement(prev);
    }
    this.setState({
      clickedElement: element
    });
  },

  placeOrderBack(id) {
    var order = _.find(this.props.orders, ['id', id]);
    this.setOrderToCoords(id, order.x, order.y);
  },

  setOrderToCoords(id, x, y) {
    var orders = this.state.orders;
    var order = _.find(orders, ['id', id]);
    var index = _.findIndex(orders, ['id', id]);
    order.x = x;
    order.y = y;
    orders.splice(index, 1, order);

    this.setState({
      orders
    });
  },

  setOrderToArea(id, target) {
    var coords = {};
    setCoordsToArea(target, coords);
    this.setOrderToCoords(id, coords.x, coords.y);
  },

  setUnitToCoords(id, group, x, y, areaId) {
    var units = this.state.units;
    var connections = this.state.connections;
    var unitsGroup = units[group];

    var unit = _.find(unitsGroup, ['id', id]);
    var index = _.findIndex(unitsGroup, ['id', id]);

    if (!_.includes(connections[unit.area], areaId)) {
      return false;
    }
    unit.x = x;
    unit.y = y;
    unit.area = areaId;
    unitsGroup.splice(index, 1, unit);

    units[group] = unitsGroup;
    this.setState({
      units
    });
  },


  setUnitToArea(id, group, target) {
    var coords = {};
    setCoordsToArea(target, coords);
    this.setUnitToCoords(id, group, coords.x, coords.y, target.id);
  },

  actionOrderToArea(prev, target) {
    this.setOrderToArea(prev.id, target);
    var mapOrders = this.state.mapOrders;
    var prevOrder = _.pickBy(mapOrders, (order) => {
      return order == prev.id;
    });
    if ( !_.isEmpty(prevOrder) ) {
      _.mapKeys(prevOrder, (val, key) => { delete mapOrders[key]; });
    }
    if (mapOrders[target.id]) {
      this.placeOrderBack(mapOrders[target.id]);
    }
    mapOrders[target.id] = prev.id;
    this.setState({
      mapOrders
    });
  },

  actionUnitToArea(prev, target) {
    var group = prev.parentElement.id;
    this.setUnitToArea(prev.id, group, target);
  },

  pathClicked(element) {
    var target = element.target;
    var prev = this.state.clickedElement;
    var playerAreas = this.state.playerAreas;
    var connections = this.props.connections;

    if (prev.localName == 'circle' && _.includes(playerAreas, target.id)) {
      this.actionOrderToArea(prev, target);

    } else if (prev.localName == 'rect' && prev.parentElement.classList[0] == 'units') {
      this.actionUnitToArea(prev, target);
    }
    this.elementClicked(target);
  },

  orderClicked(element) {
    var target = element.target;
    this.elementClicked(target);
  },

  unitClicked(element) {
    var target = element.target;
    this.elementClicked(target);
  },

  controlClicked(element) {
    var target = element.target;
    switch (target.id) {
      case 'clear':
        _.map(_.map(this.state.orders, 'id'), this.placeOrderBack);
        this.setState({
          mapOrders: {}
        });
        break;
      case 'done':
        let playerAreas = this.state.playerAreas;
        let mapOrders = this.state.mapOrders;
        if (_.every(playerAreas, id => {
          return _.has(mapOrders, id);
        }) ) {
          console.log('ok');
        } else {
          console.log('not ok');
        }
        break;
    }
  },

  renderOrder(order) {
    return (
      <circle onClick={this.orderClicked} key={order.id} id={order.id} cx={order.x} cy={order.y} fill={order.color} r="40" />
    );
  },

  renderUnit(group, unit) {
    if (!unit.x) {
      return <rect key={unit.id} />;
    }

    var dx, dy, areaCoordsAdjust = this.props.areaCoordsAdjust;
    var coordsAdjust = areaCoordsAdjust[unit.area];
    if (unit.id == 'siege_engine-0') console.log(unit.area);
    if (coordsAdjust) {
      dx = coordsAdjust.x;
      dy = coordsAdjust.y;
    }
    var props = {
      key: unit.id,
      id: unit.id,
      fill: unit.color,
      onClick: this.unitClicked,
      x: unit.x + (dx ? dx : 0),
      y: unit.y + (dy ? dy : 0),
    }

    switch (group) {
      case 'footmans':
        return <rect height='30' width='30' {...props} />;
        break;
      case 'knights':
        return <rect height='50' width='30' {...props} x={props.x+40} y={props.y-20}/>;
      case 'siege_engines':
        return <rect height='70' width='35' {...props} x={props.x-40} y={props.y-40}/>;
      default:
        return <div  {...props} />;
    }
  },

  renderUnits(units, group) {
    return (
      <g id={group} key={group} className='units'>
        {_.map(units, this.renderUnit.bind(this, group))}
      </g>
    );
  },

  render() {
    var svgStyle = {position: 'relative', background: 'url(assets/map.jpg)', backgroundRepeat: 'round'};
    var img;

    var orders = (
      <g fillOpacity='0.2' stroke="black" strokeWidth="1">
        {_.map(this.state.orders, this.renderOrder)}
      </g>
    );

    var controls = (
      <g fillOpacity='0.2' stroke="black" strokeWidth="1">
        <text x="100" y="250" fontSize="30" textAnchor="middle" fill='black' fillOpacity='1'>Done</text>
        <rect onClick={this.controlClicked} id='done' x="50" y="210" width="100" height="80" fill="red"/>
        <text x="100" y="350" fontSize="30" textAnchor="middle" fill='black' fillOpacity='1'>Clear</text>
        <rect onClick={this.controlClicked} id='clear' x="50" y="310" width="100" height="80" fill="blue"/>
      </g>
    );

    var units = (
      <g fillOpacity='0.4' stroke="black" strokeWidth="1">
        {_.map(this.state.units, this.renderUnits)}
      </g>
    );

    return (
      <div className='Map'>
        {img}
        <svg style={svgStyle} xmlns="http://www.w3.org/2000/svg"
          width="27.5in" height="41.3194in" stroke="black" strokeWidth="1" strokeOpacity='1'
          viewBox="0 0 1980 2975" fill="orange" fillOpacity='0'>
          <path onClick={this.pathClicked} id="widows_watch" ref="widows_watch"
                d="M 1123.00,819.00
                   C 1123.00,819.00 1150.00,854.00 1150.00,854.00
                     1150.00,854.00 1156.00,917.00 1156.00,917.00
                     1156.00,917.00 1213.00,948.00 1213.00,948.00
                     1213.00,948.00 1170.00,948.00 1170.00,948.00
                     1170.00,948.00 1065.00,908.00 1065.00,908.00
                     1065.00,908.00 1065.00,947.00 1065.00,947.00
                     1065.00,947.00 1046.00,985.00 1046.00,985.00
                     1046.00,985.00 1003.00,990.00 1003.00,990.00
                     1003.00,990.00 991.00,966.00 991.00,966.00
                     991.00,966.00 947.00,938.00 947.00,938.00
                     947.00,938.00 943.00,896.00 943.00,896.00
                     943.00,896.00 973.00,866.00 973.00,866.00
                     973.00,866.00 986.00,817.00 986.00,817.00
                     986.00,817.00 1026.00,801.00 1026.00,801.00
                     1026.00,801.00 1038.00,780.00 1038.00,780.00
                     1038.00,780.00 1094.00,786.00 1094.00,786.00 z" />
          <path onClick={this.pathClicked} id="white_harbor" ref="white_harbor"
                d="M 1093.00,784.00
                   C 1093.00,784.00 1120.00,773.00 1120.00,773.00
                     1120.00,773.00 1115.00,751.00 1115.00,751.00
                     1115.00,751.00 1090.00,742.00 1090.00,742.00
                     1090.00,742.00 1079.00,707.00 1079.00,707.00
                     1079.00,707.00 1045.00,705.00 1045.00,705.00
                     1045.00,705.00 1017.00,677.00 1017.00,677.00
                     1017.00,677.00 959.00,648.00 959.00,648.00
                     959.00,648.00 864.00,739.00 864.00,739.00
                     864.00,739.00 839.00,752.00 839.00,752.00
                     839.00,752.00 789.00,828.00 789.00,828.00
                     789.00,828.00 783.00,868.00 783.00,868.00
                     783.00,868.00 796.00,894.00 796.00,894.00
                     796.00,894.00 755.00,932.00 755.00,932.00
                     755.00,932.00 747.00,966.00 747.00,966.00
                     747.00,966.00 776.00,1018.00 776.00,1018.00
                     776.00,1018.00 816.00,998.00 816.00,998.00
                     816.00,998.00 828.00,971.00 828.00,971.00
                     828.00,971.00 841.00,989.00 841.00,989.00
                     841.00,989.00 857.00,1015.00 857.00,1015.00
                     857.00,1015.00 861.00,1057.00 861.00,1057.00
                     861.00,1057.00 871.00,1041.00 871.00,1041.00
                     871.00,1041.00 904.00,1021.00 904.00,1021.00
                     904.00,1021.00 942.00,1026.00 942.00,1026.00
                     942.00,1026.00 967.00,1054.00 967.00,1054.00
                     967.00,1054.00 973.00,1089.00 973.00,1089.00
                     973.00,1089.00 1015.00,1080.00 1015.00,1080.00
                     1015.00,1080.00 1045.00,1019.00 1045.00,1019.00
                     1045.00,1019.00 1044.00,991.00 1044.00,991.00
                     1044.00,991.00 1003.00,990.00 1003.00,990.00
                     1003.00,990.00 989.00,966.00 989.00,966.00
                     989.00,966.00 945.00,940.00 945.00,940.00
                     945.00,940.00 937.00,889.00 937.00,889.00
                     937.00,889.00 970.00,865.00 970.00,865.00
                     970.00,865.00 984.00,814.00 984.00,814.00
                     984.00,814.00 1021.00,799.00 1021.00,799.00
                     1021.00,799.00 1035.00,781.00 1035.00,781.00 z" />
          <path onClick={this.pathClicked} id="the_stony_shore" ref="the_stony_shore"
                d="M 283.00,669.00
                   C 283.00,669.00 297.00,697.00 297.00,697.00
                     297.00,697.00 283.00,743.00 283.00,743.00
                     283.00,743.00 211.00,723.00 211.00,723.00
                     211.00,723.00 152.00,875.00 152.00,875.00
                     152.00,875.00 167.00,912.00 167.00,912.00
                     167.00,912.00 227.00,861.00 227.00,861.00
                     227.00,861.00 223.00,950.00 223.00,950.00
                     223.00,950.00 246.00,994.00 246.00,994.00
                     246.00,994.00 244.00,1012.00 244.00,1012.00
                     244.00,1012.00 256.00,1014.00 256.00,1014.00
                     256.00,1014.00 258.00,1033.00 258.00,1033.00
                     258.00,1033.00 291.00,1042.00 291.00,1042.00
                     291.00,1042.00 296.00,1066.00 296.00,1066.00
                     296.00,1066.00 339.00,1061.00 339.00,1061.00
                     339.00,1061.00 367.00,1040.00 367.00,1040.00
                     367.00,1040.00 389.00,992.00 389.00,992.00
                     389.00,992.00 391.00,1045.00 391.00,1045.00
                     391.00,1045.00 428.00,1052.00 428.00,1052.00
                     428.00,1052.00 470.00,1006.00 470.00,1006.00
                     470.00,1006.00 490.00,989.00 490.00,988.00
                     490.00,987.00 556.00,808.00 556.00,808.00
                     556.00,808.00 497.00,753.00 497.00,753.00
                     497.00,753.00 457.00,738.00 457.00,738.00
                     457.00,738.00 432.00,666.00 432.00,666.00
                     432.00,666.00 395.00,644.00 395.00,644.00
                     395.00,644.00 323.00,670.00 323.00,670.00 z" />
          <path onClick={this.pathClicked} id="winterfell" ref="winterfell"
                d="M 964.00,646.00
                   C 964.00,646.00 993.00,669.00 993.00,669.00
                     993.00,669.00 1024.00,681.00 1024.00,681.00
                     1024.00,681.00 1047.00,706.00 1047.00,706.00
                     1047.00,706.00 1089.00,706.00 1089.00,706.00
                     1089.00,706.00 1091.00,650.00 1091.00,650.00
                     1091.00,650.00 1069.00,552.00 1069.00,552.00
                     1069.00,552.00 1048.00,517.00 1048.00,517.00
                     1048.00,517.00 1010.00,499.00 1010.00,499.00
                     1010.00,499.00 952.00,416.00 952.00,416.00
                     952.00,416.00 887.00,388.00 887.00,388.00
                     887.00,388.00 861.00,410.00 861.00,410.00
                     861.00,410.00 831.00,411.00 831.00,411.00
                     831.00,411.00 785.00,433.00 785.00,433.00
                     785.00,433.00 739.00,484.00 739.00,484.00
                     739.00,484.00 680.00,499.00 680.00,499.00
                     680.00,499.00 609.00,488.00 609.00,488.00
                     609.00,488.00 501.00,515.00 501.00,515.00
                     501.00,515.00 462.00,469.00 462.00,469.00
                     462.00,469.00 477.00,518.00 477.00,518.00
                     477.00,518.00 462.00,557.00 462.00,557.00
                     462.00,557.00 438.00,577.00 438.00,577.00
                     438.00,577.00 389.00,583.00 389.00,583.00
                     389.00,583.00 361.00,553.00 361.00,553.00
                     361.00,553.00 349.00,522.00 349.00,522.00
                     349.00,522.00 336.00,493.00 336.00,493.00
                     336.00,493.00 305.00,473.00 305.00,473.00
                     305.00,473.00 261.00,486.00 261.00,486.00
                     261.00,486.00 312.00,512.00 312.00,512.00
                     312.00,512.00 323.00,537.00 323.00,537.00
                     323.00,537.00 313.00,557.00 313.00,557.00
                     313.00,557.00 324.00,608.00 324.00,608.00
                     324.00,608.00 288.00,630.00 288.00,630.00
                     288.00,630.00 323.00,665.00 323.00,665.00
                     323.00,665.00 392.00,643.00 392.00,643.00
                     392.00,643.00 432.00,667.00 432.00,667.00
                     432.00,667.00 450.00,735.00 450.00,735.00
                     450.00,735.00 480.00,754.00 480.00,754.00
                     480.00,754.00 499.00,754.00 499.00,754.00
                     499.00,754.00 538.00,786.00 538.00,786.00
                     538.00,786.00 557.00,808.00 557.00,808.00
                     557.00,808.00 538.00,904.00 538.00,904.00
                     538.00,904.00 494.00,961.00 494.00,961.00
                     494.00,961.00 488.00,1001.00 488.00,1001.00
                     488.00,1001.00 475.00,1011.00 475.00,1011.00
                     475.00,1011.00 460.00,1048.00 460.00,1048.00
                     460.00,1048.00 493.00,1043.00 493.00,1043.00
                     493.00,1043.00 528.00,1026.00 528.00,1026.00
                     528.00,1026.00 563.00,1040.00 563.00,1040.00
                     563.00,1040.00 564.00,1051.00 564.00,1051.00
                     564.00,1051.00 679.00,1037.00 679.00,1037.00
                     679.00,1037.00 716.00,1024.00 716.00,1024.00
                     716.00,1024.00 763.00,1030.00 763.00,1030.00
                     763.00,1030.00 774.00,1017.00 774.00,1017.00
                     774.00,1017.00 746.00,965.00 746.00,965.00
                     746.00,965.00 754.00,932.00 754.00,932.00
                     754.00,932.00 794.00,894.00 794.00,894.00
                     794.00,894.00 781.00,866.00 781.00,866.00
                     781.00,866.00 787.00,824.00 787.00,824.00
                     787.00,824.00 840.00,747.00 840.00,747.00
                     840.00,747.00 873.00,730.00 873.00,730.00
                     873.00,730.00 956.00,646.00 956.00,646.00 z" />
          <path onClick={this.pathClicked} ref="karhold" id="karhold"
                stroke="black" strokeWidth="1"
                d="M 1112.00,405.00
                   C 1112.00,405.00 1128.00,402.00 1128.00,402.00
                     1128.00,402.00 1166.00,413.00 1166.00,413.00
                     1166.00,413.00 1195.00,438.00 1195.00,438.00
                     1195.00,438.00 1271.00,418.00 1271.00,418.00
                     1271.00,418.00 1295.00,460.00 1295.00,460.00
                     1295.00,460.00 1297.00,514.00 1297.00,514.00
                     1297.00,514.00 1263.00,593.00 1263.00,593.00
                     1263.00,593.00 1208.00,541.00 1208.00,541.00
                     1208.00,541.00 1190.00,653.00 1190.00,653.00
                     1190.00,653.00 1151.00,680.00 1151.00,680.00
                     1151.00,680.00 1091.00,647.00 1091.00,647.00
                     1091.00,647.00 1078.00,601.00 1078.00,601.00
                     1078.00,601.00 1072.00,556.00 1072.00,556.00
                     1072.00,556.00 1044.00,515.00 1044.00,515.00
                     1044.00,515.00 1012.00,500.00 1012.00,500.00
                     1012.00,500.00 952.00,417.00 952.00,417.00
                     952.00,417.00 958.00,395.00 958.00,395.00
                     958.00,395.00 1016.00,368.00 1016.00,368.00
                     1016.00,368.00 1060.00,398.00 1060.00,398.00
                     1060.00,398.00 1089.00,402.00 1089.00,402.00
                     1089.00,402.00 1105.00,393.00 1105.00,393.00 z" />
          <path onClick={this.pathClicked} ref="castle_black" id="castle_black"
                d="M 732.00,267.00
                   C 732.00,267.00 749.00,247.00 749.00,247.00
                     749.00,247.00 759.00,221.00 759.00,221.00
                     759.00,221.00 1023.00,223.00 1023.00,223.00
                     1023.00,223.00 1032.00,235.00 1032.00,235.00
                     1032.00,235.00 1032.00,269.00 1032.00,269.00
                     1032.00,269.00 1056.00,286.00 1056.00,286.00
                     1056.00,286.00 1069.00,321.00 1069.00,321.00
                     1069.00,321.00 1080.00,401.00 1080.00,401.00
                     1080.00,401.00 1039.00,390.00 1039.00,390.00
                     1039.00,390.00 1012.00,370.00 1012.00,370.00
                     1012.00,370.00 963.00,395.00 963.00,395.00
                     963.00,395.00 951.00,416.00 951.00,416.00
                     951.00,416.00 888.00,389.00 888.00,389.00
                     888.00,389.00 858.00,411.00 858.00,411.00
                     858.00,411.00 827.00,414.00 827.00,414.00
                     827.00,414.00 789.00,431.00 789.00,431.00
                     789.00,431.00 738.00,483.00 738.00,483.00
                     738.00,483.00 679.00,498.00 679.00,498.00
                     679.00,498.00 610.00,488.00 610.00,488.00
                     610.00,488.00 610.00,479.00 610.00,479.00
                     610.00,479.00 635.00,445.00 635.00,445.00
                     635.00,445.00 631.00,412.00 631.00,412.00
                     631.00,412.00 646.00,389.00 646.00,389.00
                     646.00,389.00 637.00,357.00 637.00,357.00
                     637.00,357.00 629.00,346.00 629.00,346.00
                     629.00,346.00 682.00,312.00 682.00,312.00
                     682.00,312.00 718.00,306.00 718.00,306.00
                     718.00,306.00 715.00,286.00 715.00,286.00 z" />
          {controls}
          {orders}
          {units}
        </svg>

      </div>
    );
  }

});
