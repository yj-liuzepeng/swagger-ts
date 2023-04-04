const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const parse = require("swagger-parser");
const beautify = require("js-beautify").js_beautify;
const { swaggerUrl } = require("./config");

// api接口方法存放目录
const API_PATH = path.resolve(__dirname, "../api");

// 判断目录是否存在
const isExist = (lastPath = "") => {
  const privatePath = `${lastPath ? API_PATH + "/" + lastPath : API_PATH}`;
  const stat = fs.existsSync(privatePath);
  if (!stat) {
    fs.mkdirSync(privatePath);
  }
};
// 接口名称处理 getColumnInfosUsingGET-->getColumnInfos  saveProjectUsingPOST-->saveProject
const moduleName = (operationId) => {
  return operationId.replace(/Using(POST|GET)/g, "");
};
// 数据类型
const dataType = (key) => {
  const type = {
    string: "string",
    integer: "number",
    int: "number",
    long: "string",
    Array: "array",
    file: "Blob",
    boolean: "boolean",
  };
  return type[key] ? type[key] : "any";
};

// 获取模块
const getModules = (map) => {
  let moduleList = [];
  map.forEach((value, key) => {
    const module = writeFileApi(key, value);
    moduleList = [...moduleList, ...module];
  });
  console.log(chalk.green("---------------------------------------------------------------"));
  console.log(chalk.green("导出成功！"));
  return moduleList;
};

// 参数item
const interfaceParamsList = (params) => {
  let str = "";
  params.forEach((item) => {
    str = `${str}
      /** ${item.description ? item.description : ""} **/
      ${item.name}${item.required ? "?" : ""}: ${dataType(item.type)}; 
    `;
  });
  return str;
};

// 定义参数类型
const interfaceParamsTpl = (params, interfaceName) => {
  if (!params || params.length === 0) {
    return "";
  } else {
    return `interface ${interfaceName} {
      ${interfaceParamsList(params)}
    }`;
  }
};

// 设置写入模板
const tplInsertApi = (apiInfo) => {
  const keys = Object.keys(apiInfo);
  const method = keys[0];
  const methodParams = apiInfo[method];
  const parameters = methodParams.parameters;
  const operationId = methodParams.operationId;
  const allPath = apiInfo.allPath;
  const requestName = moduleName(operationId);
  let interfaceName = "any";
  let interfaceParams = "data?:any";
  let parametersType = "data";
  if (parameters && parameters.length > 0) {
    interfaceName = `${requestName}Ife`;
    interfaceParams = `data?: ${interfaceName}`;
  }
  if (method.toLocaleLowerCase() === "get") {
    parametersType = "params";
    interfaceParams = `params?: ${interfaceName}`;
  }
  return `/**
    * @description ${methodParams.summary}
    */
    ${interfaceParamsTpl(parameters, interfaceName)}
    export const ${requestName} = (${interfaceParams}): ResponseType => {
      return http.request("${method}", "${allPath}", {
        ${parametersType}
      });
    };
  `;
};

// 接口名称（使用operationId）
const getModulesName = (apiInfo) => {
  const keys = Object.keys(apiInfo);
  const method = keys[0];
  const methodParams = apiInfo[method];
  const operationId = methodParams.operationId;
  return operationId;
};

// 写入文件
const writeFileApi = (fileName, apiData) => {
  // 引入封装的http方法，定义ResponseType
  let tplIndex = `import http from "../utils/http";\n
  interface ResponseType extends Promise<any> {
    data?: object;
    code?: number;
    message?: string;
  }`;
  const apiDataLen = apiData.length;
  let moduleList = [];
  for (let i = 0; i < apiDataLen; i++) {
    const item = apiData[i];
    tplIndex = `${tplIndex}\n${tplInsertApi(item)}\n`;
    moduleList.push(getModulesName(item));
  }
  tplIndex = beautify(tplIndex, {
    indent_size: 2, // 缩进宽度，默认为4
    max_preserve_newlines: 2, // 保留的最大换行符数量，默认为10
    space_in_paren: true, // 圆括号内是否保留空格，默认为false
    preserve_newlines: false, // 是否保留换行符，默认为true
    // jslint_happy: true, // 是否启用JSLint风格，默认为false
  });
  fs.writeFileSync(`${API_PATH}/${fileName}.ts`, tplIndex);
  console.log(
    chalk.blue(
      `${fileName}.ts` +
        chalk.green(" ------------ ") +
        chalk.black("[" + apiDataLen + "]") +
        chalk.green("个接口写入完成")
    )
  );
  return moduleList;
};

const gen = async () => {
  isExist();
  try {
    // 解析url 获得
    const parsed = await parse.parse(swaggerUrl);
    const paths = parsed.paths;
    const pathsKeys = Object.keys(paths); // 获取url路径
    const pathsKeysLen = pathsKeys.length;
    console.log(
      chalk.blue("开始解析，总共接口数量：") + chalk.yellow(pathsKeysLen)
    );
    console.log(chalk.red("---------------------------------------------------------------"));

    const modulesMap = new Map(); // 按文件建立 Map关系
    for (let i = 0; i < pathsKeysLen; i++) {
      const item = pathsKeys[i];
      const itemAry = item.split("/");
      const pathsItem = paths[item];
      let fileName = itemAry[2];
      if (!fileName) continue;
      fileName = fileName.toLowerCase();
      // 创建模块目录
      // isExist(fileName);
      // 完整路径
      pathsItem.allPath = item;
      if (modulesMap.has(fileName)) {
        // 继续添加到当前 fileName 文件内
        const fileNameAry = modulesMap.get(fileName);
        fileNameAry.push(pathsItem);
        modulesMap.set(fileName, fileNameAry);
      } else {
        modulesMap.set(fileName, [pathsItem]);
      }
    }
    // 获取模块，并写入文件
    getModules(modulesMap);
  } catch (e) {
    console.log(e);
  }
};

module.exports = {
  gen,
};
