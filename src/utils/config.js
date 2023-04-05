/**
 * 配置项
 * swaggerUrl：swagger文档地址
 * dirIdx：按索引生成文件，比如接口  /job/rule/createOrUpdateDataChangeRules，根据job生成配置1，根据rule生成配置2
 * topConfig：单个ts文件顶部配置，如引入axios，定义返回数据类型等等
 * apiConfig： 单个接口的结构
 */

const swaggerUrl = "http://xxx/v2/api-docs";
const dirIdx = 2
const topConfig = `import http from "../utils/http";
  interface ResponseType extends Promise<any> {
    data?: object;
    code?: number;
    message?: string;
  }`;
const apiConfig = (
  summary, // 接口描述
  interface, // 接口类型定义
  requestName, // 接口名称
  interfaceParams, // 接口传入参数及类型
  requestMethod, // 请求方法 get post delete等
  requestUrl, // 接口地址
  parametersType // 传参类型 data params
) => {
  return `/**
    * @description ${summary}
    */
    ${interface}
    export const ${requestName} = (${interfaceParams}): ResponseType => {
      return http.request("${requestMethod}", "${requestUrl}", {
        ${parametersType}
      });
    };
  `;
  // 生成结构如下
  // /**
  //  * @description 执行作业流
  //  */
  // interface executeFlowIfe {
  //   /** flowName **/
  //   flowName ? : string;
  //   /** projectName **/
  //   projectName ? : string;
  // }
  // export const executeFlow = ( data ? : executeFlowIfe ): ResponseType => {
  //   return http.request( "post", "/job/flow/executeFlow", {
  //     data
  //   } );
  // };
};

module.exports = {
  swaggerUrl,
  dirIdx,
  topConfig,
  apiConfig,
};
