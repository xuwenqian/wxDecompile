const path = require("path")
const {execSync} = require("child_process");
const fsEx = require('fs-extra');
const fastGlob = require('fast-glob');
const xlsx = require('node-xlsx');

// 需要解包的小程序根路径
const rootPath="D:/ori/20230629";
// 统计 1：按组件或api统计  2：按类型统计 
const type=1;

// 需要解包小程序
const wxapkgInfos = {
    "wx9074de28009e1111":"微博",
    "wxb296433268a1c654":"小红书",
    "wx79a83b1a1e8a7978":"快手",
    "wxb392dfcc97a84ac7":"剪映",
    "wx2c348cf579062e56":"美团外卖美食奶茶",
    "wx84d3c06952bb4072":"美团跑腿",
    "wxde8ac0a21135c07d":"美团外卖酒店电影购物景区",
    "wxc97b21c63d084d92":"58同城招聘兼职家政租房二手车",
    "wx1658c7eccb8126e7":"58同城租房二手房",
    "wx32540bd863b27570":"拼多多",
    "wx91d27dbf599dff74":"京东",
    "wxd4185d00bf7e08ac":"顺丰速运",
    "wxdcd3d073e47d1742":"百度网盘",
    "wx4f38007b839da9d3":"酷狗音乐",
    "wxa75efa648b60994b":"腾讯视频",
    "wxcd10170e55a1f55d":"爱奇艺",
    "wx7564fd5313d24844":"哔哩哔哩",
    "wx5de0c309a1472da6":"优酷视频",
    "wx190f9aa19fb3ed0a":"新浪新闻",
    "wxc32aa468714ea8ca":"人民日报数字报",
    "wxb10c47503e8c8e01":"腾讯新闻",
    "wxed19cdbb80bbe74f":"番茄看书免",
    "wxcf62686dc9d61f90":"航旅纵横",
    "wx366ae41607c228d1":"中国国航",
    "wx7643d5f831302ab0":"百度地图",
    "wx65cc950f42e8fff1":"腾讯出行",
    "wxa51f55ab3b2655b9":"铁路12306",
    "wxacd323dc751353f6":"WPS Office",
    "wx5b97b0686831c076":"金山文档",
    "wx2ea687f4258401a9":"海滨消消乐",
    "wxd93fb8bddf971d14":"海滨消消乐1",
    "wx3cbe919f36710d1c":"云闪付",
    "wx9c77cdbfe9d944e0":"同花顺",
    "wx799d4d93a341b368":"去哪儿",
    "wxb1705ff6eae7411d":"字母",
    "wxbc17fd9ddec374f7":"作业帮",
    "wx2f1e080fd0f51526":"有道词典",
    "wxe79badd292867499":"百度翻译"
}


// 反编译工具路径
const deCompileToolPath = path.join(__dirname, "/cma/nodejs/nodejs");
// 解包工具
const unPackToolPath = path.join(__dirname, '/pc_wxapkg_decrypt.exe');
// json报告输出路径
const apiCollectPath = path.join(__dirname,"/api-collect/bin/api-collect");
// 解包输出路径
const UnPackOutRootPath = path.join(__dirname, "/wxpack");
// 输出json路径
const jsonOutRootPath = path.join(__dirname, "/outjson");

// 微信小程序api/组件JSON路径
const oriWxPath = path.join(__dirname, "/min-ori");

var outDataMap = new Map()

let time = "";

// api 数据
let apiData = new Map();
// 组件数据
let mpData = new Map();
// 分类数据
let catagoryData = new Map();

run();

function init(){
    time = new Date().getTime()
    outDataMap = new Map()
    apiData = new Map();
    mpData = new Map();
    rmdir(UnPackOutRootPath);
    rmdir(jsonOutRootPath);
}

function run() {
    init()
    if(!wxapkgInfos) {
        console.info('请配置需要解包的小程序路径!!!');
       return
    }
    for(let i in wxapkgInfos) {
        let wxpid = i;
        let wxapkgPath = path.resolve(rootPath + "/" + wxpid);
        let outPath = path.resolve(UnPackOutRootPath + "/" + wxpid);
        // 创建输出路径
        createOutPath(outPath);
        // 解包
        readWxApkg(wxapkgPath, wxpid);
        // 反编译
        deCompile(outPath, wxpid);
        // 输出json
        getJSONReport(wxpid);
        // 统计输出excel
        getExcelData(wxpid)
    }
    // 写入excel
    writeExcel()

    totalmin()
}

// 读取
function readWxApkg(wxapkgPath, wxapkgPid) {
    if(!fsEx.existsSync(wxapkgPath)){
        console.info("未找到此路径，请检查：", wxapkgPath);
        return;
    }
    let filesList = getFileList(wxapkgPath)
    if(!filesList.length) {
     return;
    }
    for(let i = 0; i < filesList.length; i++) {
      execUnPackCommond(filesList[i].path, filesList[i].filename, wxapkgPid);
    }
 }

// 反编译
function deCompile(outPath,wxpid) {
    const files = fsEx.readdirSync(outPath)
    if(!files.length) {
       return;
    }
    const suffix = ".wxapkg";
    for(let i = 0; i < files.length; i++){
       const currentFileName = files[i]
       renameSync(outPath + "/"+ currentFileName, outPath + "/" + wxpid + suffix);
       execdeCompileCommond(outPath + "/"+ wxpid + suffix)
       renameSync(outPath + "/"+ wxpid + suffix, outPath + "/" + currentFileName);
       renameSync(outPath + "/"+ wxpid, outPath + "/"+ wxpid + "_" + currentFileName);
      
    }
}

// 输出JSON
function getJSONReport(wxpid) {
    let files = getFilePaths(UnPackOutRootPath+"/"+ wxpid);
    if(!files.length){
        return;
    }
    for(let i = 0; i < files.length; i++) {
        let path = files[i].path;
        let filename = files[i].filename;
        let outPath = jsonOutRootPath + "/" + wxpid + "/" + filename;
        createOutPath(outPath);
        execApiCollec(path, outPath);
        
    }
}

function getExcelData(wxpid) {
    if(!outDataMap.get(wxpid)){
        outDataMap.set(wxpid,new Map())
    }
    getOutFile(wxpid);
}

function writeExcel() {
  let excelData = []
  let count = 0;
  for (let i of outDataMap.keys()) {
    excelData.push({name:wxapkgInfos[i],data:[['名称','appid','类型','api/组件','数量']]})
    for(let j of outDataMap.get(i).keys()){
        let f = 0
       for(let k of outDataMap.get(i).get(j).keys()){
        if(f==0) {
            excelData[count].data.push([wxapkgInfos[i],i,j,k,outDataMap.get(i).get(j).get(k)])
        }else{
            excelData[count].data.push(['','','',k,outDataMap.get(i).get(j).get(k)])
        }
        f++;
       }
    }
    count++;
  }
 writeFile("out",excelData)
}

/**
 * 统计
 * @param {类型} type  1:按组件或api维度统计 ，2 :按类型统计
 */
function totalmin() {
   if(type == 1){
    totalminByApiAndComponent()
   }else if(type == 2){
    totalminByCatagory()
   }
}

// 按组件和api维度统计数据
function totalminByApiAndComponent() {
    getApiAndComponet()
    let handledata = [
        {name:'api',data:handleOutData(apiData,'api')},
        {name:'组件',data:handleOutData(mpData,'组件')}
    ]
    writeFile("apiandcomponent",handledata)
}

// 按类型统计数据
function totalminByCatagory() {
    let appCatagoryData = JSON.parse(readfileJSON('app_mpid_catagory.json'));
    for(let i= 0; i < appCatagoryData.length; i++) {
        let info = appCatagoryData[i]
        if(!catagoryData.get(info.catagory)){
            catagoryData.set(info.catagory,new Map())
        }
        getApiAndComponet(info.mp_id, info.catagory)
    }

    let keys  = catagoryData.keys()
    let handledata = []
    for(let k of keys){
        let api = handleOutData(catagoryData.get(k).get("api"),'api')
        let mp = handleOutData(catagoryData.get(k).get("mp"),'mp')
        handledata.push({
            name:k,
            data:api.concat(mp)
        })
    }
   writeFile("cataryData",handledata)

}

function getApiAndComponet(mp_id, catagory){
    let data = readExcel();
    let apiAndMpData = JSON.parse(readfileJSON('wechat_mp_apis.json'));
    for(let i = 0; i < apiAndMpData.length; i++) {
        let _api = apiAndMpData[i].api;
        let _mp = apiAndMpData[i].mp;
        if(!!_api && !apiData.get(_api)) {
            if(!!mp_id){
                if(!catagoryData.get(catagory).get("api")){
                    catagoryData.get(catagory).set("api",new Map())
                }
                if(!catagoryData.get(catagory).get("api").get(_api)) {
                   catagoryData.get(catagory).get("api").set(_api,[])
                }
            }else{
                apiData.set(_api,[]);
            }
        }
        if(!!_mp && !mpData.get(_mp)) {
            if(!!mp_id){
                if(!catagoryData.get(catagory).get("mp")){
                    catagoryData.get(catagory).set("mp",new Map())
                }
                if(!catagoryData.get(catagory).get("mp").get(_mp)){
                  catagoryData.get(catagory).get("mp").set(_mp,[])
                }
            }else{
                mpData.set(_mp,[]);
            }
        }
        getDataByExcel(data ,_api ,_mp, mp_id, catagory);
    }
}



// 处理输出数据
function handleOutData(datas,type){
 let  results = [[type,'应用个数','应用']];
 let keys = datas.keys()
 for (let i of keys) {
    results.push([i,datas.get(i).length,datas.get(i).length<=0?'':datas.get(i).map(item=> item.name+"/"+item.wxpid).join(";")])
 }
 return results;
}


//写入
function writeFile(fileName,data){
    fsEx.writeFileSync(jsonOutRootPath +'/'+fileName+'.xlsx',xlsx.build(data),"binary");
}


function getDataByExcel(data ,_api ,_mp, mp_id, catagory) {
    for(let i = 0; i < data.length; i++){
        if(!!_api || !!_mp){
            let values = Object.values(data[i].data)
            if(!values){
                return;
            }
            if(values.length > 1){
                let v = Object.values(values[1])
                if(!!mp_id && v[1] != mp_id){
                    continue;
                }
                values.forEach((item, index)=>{
                    if(item.includes(_api)){
                        if(!mp_id){
                            apiData.get(_api).push({name:v[0],wxpid:v[1]})
                        }else{
                            catagoryData.get(catagory).get("api").get(_api).push({name:v[0],wxpid:v[1]})
                        }
                    }
                    if(item.includes("'"+_mp+"'")){
                        if(!mp_id){
                            mpData.get(_mp).push({name:v[0],wxpid:v[1]})
                        }else{
                            catagoryData.get(catagory).get("mp").get(_mp).push({name:v[0],wxpid:v[1]})
                        }
                    }
                })
            }
        }
    }
}

function readExcel() {
    // 读取excel
    let excelPath = path.resolve(jsonOutRootPath, "out.xlsx");
    const xlsxContent =  xlsx.parse(excelPath);
    return xlsxContent;
}

// 读取json文件
function readfileJSON(fileName){
    const files = path.resolve(oriWxPath, fileName);
    return fsEx.readFileSync(files,"utf-8")
}

// 获取输出文件
function getOutFile(wxpid) {
    const collectorInfos = [
        { 
            suffix: 'api.json',
            type: 'api'
        },
        { 
            suffix: 'config.json',
            type: 'config'
        },
        { 
            suffix: 'xml.json',
            type: 'xml'
        },
        { 
            suffix: 'components.json',
            type: 'components'
        },
        // { 
        //     suffix: '3rd.json',
        //     type: '3rd'
        // },
    ]
    for(let i = 0; i < collectorInfos.length; i++) {
        let { suffix, type} = collectorInfos[i];
        let outPath = path.resolve(jsonOutRootPath,wxpid)
        if(!outDataMap.get(wxpid).get(type)){
            outDataMap.get(wxpid).set(type,new Map())
        }
        const files = fastGlob.sync(`**/${suffix}`,{cwd: outPath});
        readOutFile(files,outPath,type,wxpid)
    }
}

function readOutFile(files, outPath,type,wxpid){
   if(!files.length) {
    return;
   }
   for(let i = 0; i < files.length; i++) {
      let filePath = path.resolve(outPath,files[i]);
      let data = JSON.parse(fsEx.readFileSync(filePath,'utf8'));
      for(let k in data){
        let v = data[k];
        if(!outDataMap.get(wxpid).get(type).get(v)) {
            outDataMap.get(wxpid).get(type).set(v,1)
        }else{
            outDataMap.get(wxpid).get(type).set(v,outDataMap.get(wxpid).get(type).get(v) + 1)
        }
      }
   }
}
// 输出路径
function createOutPath(dirPath) {
  if(!fsEx.existsSync(dirPath)) {
    mkdir(dirPath);
  }
}

// 读取文件
function readFileList(filePath, filesList) {
    if(!fsEx.existsSync(filePath)){
        console.info("未找到此路径，请检查：", filePath);
        return;
    }
    var files = fsEx.readdirSync(filePath);
    if(!files.length) {
        return;
    }
    for(let i = 0; i < files.length; i++){
        let ele = files[i];
        const childPath = path.resolve(filePath,ele);
        var stat = fsEx.statSync(childPath);
        if (stat.isDirectory()) {//递归读取文件
            readFileList(childPath, filesList)
        } else {
            var obj = {};//定义一个对象存放文件的路径和名字
            obj.path = childPath;//路径
            obj.filename = ele;//名字
            filesList.push(obj);
        }
    }
}

function getFileList(filePath,filesList){
    var filesList = [];
    readFileList(filePath, filesList);
    return filesList;
}

//读取文件路径
function readFilePaths(filePath, filesList) {
    if(!fsEx.existsSync(filePath)){
        console.info("未找到此路径，请检查：", filePath);
        return;
    }
    var files = fsEx.readdirSync(filePath);
    if(!files.length) {
        return;
    }
    for(let i = 0; i < files.length; i++) {
        let ele = files[i];
        const childPath = path.resolve(filePath,ele);
        var stat = fsEx.statSync(childPath);
        if (stat.isDirectory()) { //递归读取文件
            if(childPath.indexOf(".wxapkg") != -1){
              var obj = {};//定义一个对象存放文件的路径和名字
              obj.path = childPath;//路径
              obj.filename = ele;//名字
              filesList.push(obj);
            } else {
              readFilePaths(childPath, filesList)
            }
        } 
    }
}

function getFilePaths(filePath) {
    var filesList = [];
    readFilePaths(filePath, filesList);
    return filesList;
}

// 创建文件夹
function mkdir(dirpath) {
    fsEx.mkdirSync(dirpath, { recursive: true });
}
// 删除文件夹
function rmdir(path) {
    if(fsEx.existsSync(path)) {
        fsEx.removeSync(path)
    }
}

/**
 * 重命名
 * @param oldPath 
 * @param newPath 
 */
function renameSync(oldPath,newPath){
    fsEx.renameSync(oldPath, newPath);
}


/***
 * 执行解包命令(pc_wxapkg_decrypt.exe -wxid wx9074de28009e1111 -in D:/ori/wx9074de28009e1111/274/__APP__.wxapkg -out D:\decompile\wxpack\wx9074de28009e1111\__APP__.wxapkg)
 * @param wxapkgPath 输入文件路径
 * @param filename 文件名
 * @param wxapkgPid 小程序pid
 */
function execUnPackCommond(filePath, fileName, wxapkgPid) {
    // 输入路径
    console.info("开始解包:", filePath);
    let exec_path = unPackToolPath + " -wxid "+ wxapkgPid +" -in "+ filePath +" -out D:/decompile/wxpack/" + wxapkgPid + "/" + fileName;// 执行函数
    execSync(exec_path)
    console.info("解包完成:", filePath);
}

/**
 * 反编译命令("D:/decompile/cma/nodejs/nodejs/node.exe D:/decompile/cma/nodejs/nodejs/wuWxapkg.js D:/decompile/wxpack/wx9074de28009e1111/wx9074de28009e1111.wxapkg")
 * @param filePath  编译文件路径
 */
function execdeCompileCommond(filePath) {
  console.info("开始反编译:", filePath);
  let exec_path = path.resolve(deCompileToolPath + "/node.exe") + " " + path.resolve(deCompileToolPath + "/wuWxapkg.js") + " " + path.resolve(filePath)
  execSync(exec_path)
  console.info("反编译完成:", filePath);
}

/**
 * API 收集命令(bin\api-collect D:\out\jingdong\input\wx91d27dbf599dff74__APP__  D:\out\jingdong\out)
 * 
 */
function execApiCollec(path,outPath) {
   console.info("开始输出报告:", outPath);
   let exec_path = apiCollectPath + " " + path + " " + outPath;
   execSync(exec_path)
   console.info("完成输出报告:", outPath);
}