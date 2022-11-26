
// /**
// * 游戏配置文件
// */

// // 不同级别的配置信息
// var config = {
// 	easy : {
// 		row : 10,
// 		col : 10,
// 		mineNum : 10,
// 	},
// 	normal : {
// 		row : 15,
// 		col : 15,
// 		mineNum : 30,
// 	},
// 	hard : {
// 		row : 20,
// 		col : 20,
// 		mineNum : 60,
// 	},
// };

// // 当前游戏难度，默认是easy
// var curLevel = config.easy;

// /**
// * 工具函数
// */

// // 获取dom元素，选择器的函数
//  function $(selector){
//  	return document.querySelector(selector);
//  }

// // 获取所有符合要求的dom元素，选择器的函数
//  function $$(selector){
//  	return document.querySelectorAll(selector);
//  }

/**
* 游戏主要逻辑
*/

// 存储生成的地雷的数组
var mineArray = null;

// 获取雷区容器
var mineArea = $(".mineArea");

// 存储整张地图每个格子的信息
var tableData = [];

// 存储用户插旗的DOM元素
var flagArray = [];

// 获取游戏难度选择的所有按钮
var btns = $$(".level>button");

// 插旗数量的DOM元素
var flagNum = $(".flagNum");

// 当前级别雷数的DOM元素
var mineNumber = $(".mineNum");

/**
* 生成地雷的方法
* @return 返回地雷数组
*/
function generateMine(){
	// 生成对应长度的数组
	var arr = new Array(curLevel.row * curLevel.col);
	// 向数组里填充值
	for(var i = 0; i < arr.length; i++){
		arr[i] = i;
	}
	// 打乱数组顺序
	arr.sort(()=> 0.5 - Math.random());
	// 只保留对应雷数量的数组长度
	return arr.slice(0, curLevel.mineNum);
}

/**
* 场景重置
*/
function clearScene(){
	mineArea.innerHTML = "";
	flagArray = []; // 清空插旗的数组
	flagNum.innerHTML = 0; // 重置插旗数
	mineNumber.innerHTML = curLevel.mineNum; // 重置当前级别的雷数
}

/**
* 游戏初始化函数
*/
function init(){
	
	// 清空场景，重置信息，否则会出现多个游戏区
	clearScene();

	// 1.随机生成所选配置对应数量的雷
	mineArray = generateMine();
	// console.log(mineArray);
	
	// 2.生成所选配置的网格
	var table = document.createElement('table');

	// 初始化格子的下标
	var index = 0;

	for(var i=0; i < curLevel.row; i++){
		// 创建行
		var tr = document.createElement("tr");
		tableData[i] = [];
		for(var j=0; j < curLevel.col; j++){
			// 创建列
			var td = document.createElement("td");
			var div = document.createElement("div");
			// 每一个小格子对应一个js对象
			// 该对象存储额外的信息
			/**
			*	tableData[i] = {
					// row：该格子的行
					// col：该格子的列
					// type：格子的类型 0：空白， number： 数字， mine：地雷
					// value: 周围雷的数量
					// index：格子的下标
					// checked: boolean 是否被检验过
				}
			*/
			tableData[i][j] = {
				row : i,
				col : j,
				type : 'number',
				value : 0,
				index,
				checked : false
			};

			// 为每一个div添加一个下标，方便用户点击的时候获取对应格子的下标
			div.dataset.id = index;
			// 标记当前的div是可以插旗的
			div.classList.add("canFlag");
			// 查看当前格子的下标是否在雷的数组里面
			if(mineArray.includes(tableData[i][j].index)){
				tableData[i][j].type = "mine";
				div.classList.add("mine");
			}

			td.appendChild(div);
			tr.appendChild(td);
			// 下标自增
			index++;
		}

		table.appendChild(tr);
	}

	mineArea.appendChild(table);

	// 每次初始化，都需要重新绑定鼠标点击事件
	// 每次游戏结束时，都移除了事件
	// 用 mousedown才能区分左右键，不要用click
	// 鼠标点击事件
	mineArea.onmousedown = function(e){
		if(e.button === 0){
			// 说明用户点击的是鼠标左键，进行区域搜索操作
			searchArea(e.target); // 传参一个div
		}
		if(e.button === 2){
			// 说明用户点击的是鼠标右键，进行插旗操作
			flag(e.target);
		}
	}
}

/**
 * 显示答案
 */
function showAnswer(){
	// 核心逻辑：
	// 当前格子标红，把所有的雷显示出来
	// 有些雷可能是插了旗，需要判断插旗是否正确
	// 正确添加上绿色背景，错误添加上红色背景

	var isAllRight = true;
	
	// 获取所有雷的 DOM 元素
	var mineArr = $$("td>div.mine");
	for(var i=0; i<mineArr.length; i++){
		mineArr[i].style.opacity = 1;
	}
	// 遍历用户的插旗，判断是否插旗正确
	for(var i=0; i < flagArray.length; i++){
		if(flagArray[i].classList.contains("mine")){
			// 包含mine样式，说明插旗正确
			flagArray[i].classList.add("correct");
		}else{
			// 不包含mine样式，说明插旗正确
			flagArray[i].classList.add("error");
			isAllRight = false;
		}
	}

	// 游戏结束包含两种情况：
	// 1. 插旗错误
	// 2. 已插的旗都正确，但没有全部找出雷，就踩雷了
	if(!isAllRight || flagArray.length != curLevel.mineNum){
		gameOver(false);
	}

	// 取消事件，游戏结束以后点击游戏区无效
	mineArea.onmousedown = null;
}

/**
 * 找到对应DOM在tableData里面的JS对象
 * @param {*} cell 接收用户点击的单元格
 */
function getTableItem(cell){
	var index = cell.dataset.id;
	var flatTableData = tableData.flat();
	return flatTableData.filter(item => item.index == index)[0];
}


/**
 * 会返回该对象对应的四周的边界
 * @param {*} obj 格子对应的JS对象
 */
function getBound(obj){
	// 确定上下边界
	var rowTop = obj.row - 1 < 0 ? 0 : obj.row - 1;
	var rowBottom = obj.row + 1 === curLevel.row ? curLevel.row - 1 : obj.row + 1;

	// 确定左右边界
	var colLeft = obj.col - 1 < 0 ? 0 : obj.col - 1;
	var colRight = obj.col + 1 === curLevel.col ? curLevel.col - 1 : obj.col + 1;

	return {
		rowTop,
		rowBottom,
		colLeft,
		colRight,
	}

}


/**
 * 返回周围一圈雷
 * @param {*} obj 格子对应的JS对象
 */
function findMineNum(obj){
	var count = 0; // 地雷计数器
	var {rowTop, rowBottom, colLeft, colRight} = getBound(obj);
	for(var i = rowTop; i <= rowBottom; i++){
		for(var j = colLeft; j <= colRight; j++){
			if(tableData[i][j].type === "mine"){
				count++;
			}
		}
	}
	return count;
}


/**
 * 根据tableData中的js对象返回对应的DOM对象
 * @param (*) obj
 */
function getDOM(obj){
	// 获取到所有的 div
	var divArray = $$("td>div");
	// 返回对应下标的 div
	return divArray[obj.index];
}

/**
 * 搜索该单元格周围的九宫格区域
 * @param {*} cell 接收用户点击的DOM单元格
 */
function getAround(cell){

	if(cell.classList.contains("flag")){
		// 当前的单元格没有被插旗，才能继续操作
		// 有插旗的格子，即使周围没有雷，也不能被打开
		return;
	}

	cell.parentNode.style.border = "none"; // 如果不去掉，填写数字后，格子会被拉长
	cell.classList.remove("canFlag"); // 被搜索打开的区域不能插旗

	// 1.获取到该DOM元素在tableData里面所对应的对象
	var tableItem = getTableItem(cell);

	// 处理边界情况：用户点格子边界或空白区域，无法取到data-id，结果是undefined
	if(!tableItem){
		return;
	}

	// 当前单元格如果已经被检查过，打标，避免搜索时陷入死循环
	tableItem.checked = true;

	// 得到DOM对象所对应的的JS对象后，查看周围一圈格子是否有雷
	var mineNum = findMineNum(tableItem);
	if(!mineNum){
		// 说明周围没有雷，需要继续搜索
		var {rowTop, rowBottom, colLeft, colRight} = getBound(tableItem);
		for(var i = rowTop; i <= rowBottom; i++){
			for(var j = colLeft; j <= colRight; j++){
				if(!tableData[i][j].checked){
					// 没有检查过的格子，递归搜索周围
					getAround(getDOM(tableData[i][j]));
				}
			}
		}

	}else{
		// 说明周围有雷，当前格子要显示对应雷的数量
		var cl = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight"]; 
		cell.classList.add(cl[mineNum]);
		cell.innerHTML = mineNum;
	}

}

/**
 * 区域搜索
 * @param {*} cell 用户点击的DOM元素
 */
function searchArea(cell){
	// 搜索结果分三种情况：
	// 1. 当前单元格是雷，游戏结束
	if(cell.classList.contains("mine")){
		// 踩雷的处理
		cell.classList.add("error");
		showAnswer();
		return;
	}
	// 2. 当前单元格不是雷，判断周围一圈有没有雷
	// 如果有雷，显示雷的数量
	// 如果没有雷，继续递归搜索
	getAround(cell);
}

/**
 * 判断用户的插旗是否全部正确
 */
function isWin(){
	// 遍历插旗的的DOM元素，如果有一个没有挂载mine的样式，不能算获胜
	for(var i = 0; i < flagArray.length; i++){
		if(!flagArray[i].classList.contains("mine")){
			return false;
		}
	}
	return true;
}

/**
 * 游戏结束
 * 分为两种情况
 * @param {*} isWin:boolean, true 游戏胜利, false 游戏失败
 */
function gameOver(isWin){
	var msg = "";
	if(isWin){
		msg = "游戏胜利，你找出了所有的雷！";
	}else{
		msg = "游戏失败！";
	}
	setTimeout(function(){
		window.alert(msg);
	}, 0);
}

/**
 *
 * @param {*} cell 用户点击的DOM元素
 */
function flag(cell){
	// 只有点击的DOM元素包含canFlag样式类
	// 才能进行插旗操作
	if(cell.classList.contains("canFlag")){
		if(!flagArray.includes(cell)){
			// 当前操作格子没插旗，进行插旗操作
			flagArray.push(cell);
			cell.classList.add("flag");
			// 进行插旗数的判断，插旗数不能超过当前级别的雷数
			if(flagArray.length === curLevel.mineNum){
				// 判断玩家是否胜利
				if(isWin()){
					gameOver(true);
				}
				// 无论成功或失败，都显示最终答案
				showAnswer();
			}
		}else{
			// 单元格已经插旗，再次右键点击，取消插旗操作
			var index = flagArray.indexOf(cell);
			flagArray.splice(index, 1); // 把插旗的格子从数组中移除
			cell.classList.remove("flag"); // 移除样式类
		}
		$(".flagNum").innerHTML = flagArray.length; // 更新统计插旗数
	}
}

/**
* 绑定事件
*/
function bindEvent(){
	
	// 阻止默认的鼠标右键行为
	// 默认会弹出右键菜单
	mineArea.oncontextmenu = function(e){
		e.preventDefault();
	}

	// 游戏难度选择
	$(".level").onclick = function(e){
		// 先移除所有按钮的样式，再给所选择的难度加上样式
		for(var i = 0; i < btns.length; i++){
			btns[i].classList.remove("active");
		}
		e.target.classList.add("active");
		// 修改难度
		switch(e.target.innerHTML){
			case "初级":{
				curLevel = config.easy;
				break;
			}
			case "中级":{
				curLevel = config.normal;
				break;
			}
			case "高级":{
				curLevel = config.hard;
				break;
			}

		}
		init(); // 重新初始化
	}
}

/**
* 程序入口
*/
function main(){
	// 1. 游戏的初始化
	init();
	// 2. 绑定事件
	bindEvent();
}

// 等待所有脚本、样式都加载完毕后，才开始游戏
// 否则有可能报错
window.onload = function(){
	main();
}