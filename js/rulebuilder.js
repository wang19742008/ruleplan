/*
	options:
		tableId: table id
		title: 标题
		rules:规则定义 [
			{
				"name": "taobaoUser",
				"text": "淘宝用户",
				"vtype": "select",
				"values": [
					{
						"name": "true",
						"text": "是"
					},
					{
						"name": "false",
						"text": "否"
					}
				]
			}]
		targets: 目标定义 { "0": 'H5', "1": '店铺', "2": 'Tanx', "3": '外投外', "_sub": '子规则'}
*/
function RuleBuilder(options){
	var self = this;
	this.rules = options.rules;
	this.tableId = options.tableId;
	this.targets = options.targets;
	
	this.tableObj = $('#' + this.tableId);
	this.tableObj.appendGrid({
		caption: options.title || 'test',
		initRows: 1,
		columns: self.getGridCols(),
		hideButtons: {
			remove: true,
			removeLast: true,
			insert: true,
			moveUp: true,
			moveDown: true,
			append: true
		},
		dataLoaded: function(caller){
			self.procAllRow();
		}
	});
}

RuleBuilder.prototype.addRow = function(){
	var newInx =  this.tableObj.appendGrid('getRowCount');
	this.tableObj.appendGrid('insertRow', 1, newInx);
	this.setCtrlValue('prid', newInx, '-1');
	this.setCtrlValue('rid', newInx, this.getUniqueIndex(newInx));
	this.procRow(newInx);
}

RuleBuilder.prototype.getGridCols = function(){
	var self = this;
	var cols = [];
	//规则列
	var ruleCol = { name: 'rule', display: '条件', type: 'custom'};
	ruleCol.customBuilder = function (parent, idPrefix, name, uniqueIndex) {
		var ctrlId = idPrefix + '_' + name + '_' + uniqueIndex;
		var ctrl = document.createElement('span');
		$(ctrl).attr({ id: ctrlId, name: ctrlId }).css({'margin-right':'30px'}).appendTo(parent);
		
		var select = $('<select>', { id: ctrlId + '_rule' });
		select.append('<option value="">请选择</option>');
		$.each(self.rules,function(i,d){
			select.append('<option value="'+d.name+'">' + d.text +'</option>');
		});
		select.css({'width':'200px'}).appendTo(ctrl);
		
		select.bind('change',function(){
			var id = idPrefix + '_val_' + uniqueIndex;
			var co = $('#'+ id);
			co.empty();
			var cf = self.getRuleInfo(select.val());
			//console.log(cf);
			if(cf.vtype == 'checkbox'){
				$.each(cf.values,function(i,d){
					co.append('<input type="checkbox" name="'+ (id+'_v') +'" value="'+ d.name +'"/>' + d.text);
				});
			}
			if(cf.vtype == 'select'){
				co.append('<select id="'+ (id+'_v') +'"></select>');
				var c = $('#'+id+'_v');
				$.each(cf.values,function(i,d){
					c.append('<option value="' + d.name +'">' + d.text + '</option>');
				});
			}
		});
		return ctrl;
	};
	ruleCol.customGetter = function (idPrefix, name, uniqueIndex) {
		var ctrlId = idPrefix + '_' + name + '_' + uniqueIndex;
		var rt = $('#' + ctrlId + '_rule').val();
		return rt;
	};
	ruleCol.customSetter = function (idPrefix, name, uniqueIndex, value) {
		var ctrlId = idPrefix + '_' + name + '_' + uniqueIndex;
		$('#' + ctrlId + '_rule').val(value);
		$('#' + ctrlId + '_rule').change();
	};
	
	//值列
	var valCol = { name: 'val', display: '值', type: 'custom'};
	valCol.customBuilder = function (parent, idPrefix, name, uniqueIndex) {
		var ctrlId = idPrefix + '_' + name + '_' + uniqueIndex;
		var ctrl = document.createElement('span');
		$(ctrl).attr({ id: ctrlId, name: ctrlId }).css({'margin-right':'30px'}).appendTo(parent);
		
		//var select = $('<select>', { id: ctrlId + '_val' });
		//select.css('width', '150px').appendTo(ctrl);
		return ctrl;
	};
	valCol.customGetter = function (idPrefix, name, uniqueIndex) {
		/*
		var ctrlId = idPrefix + '_' + name + '_' + uniqueIndex;
		var rt = $('#' + ctrlId + '_val').val();
		*/
		var rt = "";
		var cf = self.getRuleInfo($('#'+idPrefix + '_rule_' + uniqueIndex+'_rule').val());
		if(!cf){
			console.error('rules not found.');
			alert('rules not found');
		}
		var ctrlId = idPrefix + '_val_' + uniqueIndex+'_v';
		if(cf.vtype == 'checkbox'){
			$('input[name="'+ ctrlId +'"]:checked').each(function(){
				rt += $(this).val() + ',';
			});
		}
		if(cf.vtype == 'select'){
			rt = $('#'+ ctrlId).val();
		}
		return rt;
	};
	valCol.customSetter = function (idPrefix, name, uniqueIndex, value) {
		/*
		var ctrlId = idPrefix + '_' + name + '_' + uniqueIndex;
		$('#' + ctrlId + '_val').val(value);
		*/
		var cf = self.getRuleInfo($('#'+idPrefix + '_rule_' + uniqueIndex+'_rule').val());
		var ctrlId = idPrefix + '_val_' + uniqueIndex+'_v';
		if(cf.vtype == 'checkbox'){
			var arr = value.split(',');
			$.each(arr,function(i,d){
				$('input[name="'+ ctrlId +'"][value="'+d+'"]').attr('checked','true');
			});
		}
		if(cf.vtype == 'select'){
			$('#'+ ctrlId).val(value);
		}
	};
	
	//操作列
	var opCol = { name: 'op', display: '操作', type: 'custom'};
	opCol.customBuilder = function (parent, idPrefix, name, uniqueIndex) {
		var ctrlId = idPrefix + '_' + name + '_' + uniqueIndex;
		var ctrl = document.createElement('span');
		$(ctrl).attr({ id: ctrlId, name: ctrlId }).appendTo(parent);
		var btnAdd = $('<input>', { type: 'button',id: ctrlId + '_add',value: '+'});
		var btnDel = $('<input>', { type: 'button',id: ctrlId + '_del', value: '-'});
		btnAdd.css({'width':'30px','margin':'0 5px 0 5px'}).appendTo(ctrl);
		btnDel.css({'width':'30px','margin':'0 5px 0 5px'}).appendTo(ctrl);
		
		btnAdd.bind('click',function(){
			self.addRowValue(self.getRowIndex(uniqueIndex));
		});
		btnDel.bind('click',function(){
			self.delRow(uniqueIndex);
		});
		return ctrl;
	};
	
	cols.push(ruleCol);
	cols.push(valCol);
	cols.push({ name: 'trf', display: '流量(%)', type: 'text',  value:100 ,ctrlAttr: { maxlength: 4 }, ctrlCss: { width: '50px'} });
	cols.push({ name: 'target', display: '结果', type: 'select', ctrlOptions: this.targets, 
				onChange: function (evt, rowIndex) {
					var v = self.getCtrlValue('target', rowIndex);
					if(v == '_sub'){
						self.addRowSubRule(rowIndex);
					}
				}
			});
	cols.push({ name: 'prid', type: 'hidden', value: -1 });
	cols.push({ name: 'rid', type: 'hidden', value: 1 });
	cols.push(opCol);
	return cols;
}

RuleBuilder.prototype.procAllRow = function(){
	var count =  this.tableObj.appendGrid('getRowCount');
	for(var i=0;i<count;i++){
		this.procRow(i);
	}
}
RuleBuilder.prototype.procRow = function (inx){
	if(inx == 0){
		return;
	}
	var preElem = this.getCellCtrl('rule', inx-1);
	var preRule = this.getCtrlValue('rule', inx-1);
	var prid = this.getCtrlValue('prid', inx);
	var preTarget = this.getCtrlValue('target', inx-1);
	
	var elem = this.getCellCtrl('rule', inx);
	var leftBlank = $(preElem).css('margin-left')?$(preElem).css('margin-left').replace('px',''):'0';
	if(preTarget == '_sub'){
		leftBlank = parseInt(leftBlank) + 50;
		var uniqueInx = this.getUniqueIndex(inx-1);
		$('#tblAppendGrid_op_'+uniqueInx+'_add').hide();
	}else if(prid == -1){
		leftBlank = '0';
	}
	$(elem).css('margin-left', leftBlank+'px');
	
	var preVal = this.getCtrlValue('rule', inx-1);
	var curVal = this.getCtrlValue('rule', inx);
	if(preVal && preVal == curVal){
		var ctrlId = 'tblAppendGrid_rule_'+this.getUniqueIndex(inx)+'_rule';
		$('#' + ctrlId).hide();
	}
}

RuleBuilder.prototype.addRowValue = function(inx){
	var newInx = inx+1;
	this.tableObj.appendGrid('insertRow', 1, newInx);
	var preRule = this.getCtrlValue('rule', inx);
	var prePrid = this.getCtrlValue('prid', inx);
	this.setCtrlValue('rule', newInx, preRule);

	this.setCtrlValue('prid', newInx, prePrid);
	this.setCtrlValue('rid', newInx, this.getUniqueIndex(newInx));
	this.procRow(newInx);
}
RuleBuilder.prototype.addRowSubRule = function (inx){
	var newInx = inx+1;
	this.tableObj.appendGrid('insertRow', 1, newInx);
	this.setCtrlValue('prid', newInx, this.getUniqueIndex(inx));
	this.setCtrlValue('rid', newInx, this.getUniqueIndex(newInx));
	this.procRow(newInx);
}
RuleBuilder.prototype.delRow = function (uniqueIndex){
	this.tableObj.appendGrid('removeRow', this.tableObj.appendGrid('getRowIndex', uniqueIndex));
	var count =  this.tableObj.appendGrid('getRowCount');
	for(var i=0;i<count;i++){
		if(this.getCtrlValue('prid',i) == uniqueIndex){
			this.tableObj.appendGrid('removeRow', i);
		}
	}
}
RuleBuilder.prototype.getUniqueIndex = function (inx){
	return this.tableObj.appendGrid('getUniqueIndex', inx);
}
RuleBuilder.prototype.getRowIndex = function (uniqueIndex){
	return this.tableObj.appendGrid('getRowIndex', uniqueIndex);
}
RuleBuilder.prototype.getCellCtrl = function (colName, inx){
	return this.tableObj.appendGrid('getCellCtrl', colName, inx);
}
RuleBuilder.prototype.setCtrlValue = function (colName, inx, value){
	this.tableObj.appendGrid('setCtrlValue', colName, inx, value);
}
RuleBuilder.prototype.getCtrlValue = function (colName, inx){
	return this.tableObj.appendGrid('getCtrlValue', colName, inx);
}
RuleBuilder.prototype.getRuleInfo = function (name){
	for(var i=0;i<this.rules.length;i++){
		if(this.rules[i].name == name){
			return this.rules[i];
		}
	}
}

RuleBuilder.prototype.getvalue = function(){
	var self = this;
	var result = [];
	var json = this.tableObj.appendGrid('getAllValue');
	var tmp = [];
	//console.log(JSON.stringify(json));
	
	for(var i=0;i<json.length;i++){
		var item = json[i];
		if(item.prid != '-1'){
			var t = self.findItem(tmp,item.prid);
			if(t){
				if(typeof(t.target) == 'string'){
					t.target = [];
				}
				t.target.push(item);
			}
		}else{
			tmp.push(item);
		}
	}
	//console.log(JSON.stringify(tmp));
	for(var j=0;j<tmp.length;j++){
		var o = {};
		o.value = tmp[j].val;
		o.percent = tmp[j].trf;
		o.target = self.buildTarget(tmp[j].target);
		if(j>0 && tmp[j-1].rule == tmp[j].rule){
			result[result.length-1].params.push(o);
		}else{
			var rc = {};
			rc.rule = tmp[j].rule;
			rc.params = [];
			rc.params.push(o);
			result.push(rc);
		}
	}
	//console.log(JSON.stringify(result));
	return result;
}

RuleBuilder.prototype.findItem = function (json, rid){
	var self = this;
	if(self.isArray(json)){
		for(var i=0;i<json.length;i++){
			if(json[i].rid == rid){
				return json[i];
			}
			if(self.isArray(json[i].target)){
				var r = self.findItem(json[i].target,rid);
				if(r){
					return r;
				}
			}
		}
	}else{
		if(json.rid == rid){
			return json;
		}
	}
	return null;
}

RuleBuilder.prototype.buildTarget = function (arr){
	var self = this;
	if(!self.isArray(arr)){
		return arr;
	}
	var rt = {};
	rt.rule = arr[0].rule;
	rt.params = [];
	for(var i=0;i<arr.length;i++){
		var p = {};
		p.value = arr[i].val;
		p.percent = arr[i].trf;
		if(self.isArray(arr[i].target)){
			p.target = self.buildTarget(arr[i].target);
		}else{
			p.target = arr[i].target;
		}
		rt.params.push(p);
	}
	return rt;
}

RuleBuilder.prototype.isArray = function (arg){
  return Object.prototype.toString.call(arg) === '[object Array]';
}

RuleBuilder.prototype.load = function(cfgData){
	var self = this;
	var rt = [];
	$.each(cfgData, function(i, d){
		self.loadConfig(d,-1,rt);
	});
	console.log(JSON.stringify(rt));
	this.tableObj.appendGrid('load',rt);
}
RuleBuilder.prototype.loadConfig = function (json, prid, set){
	var self = this;
	$.each(json.params, function(i, d){
		var rt = {};
		rt.rule = json.rule;
		rt.rid = set.length+1;
		rt.val = d.value;
		rt.trf = d.percent;
		rt.prid = prid;
		if(typeof d.target === 'object'){
			rt.target = '_sub';
			set.push(rt);
			self.loadConfig(d.target,rt.rid, set)
		}else{
			rt.target = d.target;
			set.push(rt);
		}
		
	});
}