const {
  juejin_cookie
} = require('./cookie.js')
 
const axios = require('axios');

let $axios = axios.create({
  withCredentials: true,
  timeout: 30000, //超时时间
  baseURL: "https://api.juejin.cn/growth_api/v1/",
  headers: {
    'Accept': 'application/json',
    'cookie': juejin_cookie 
  }
})
 
const _http = (options) => {
  let {
    url,
    method = 'get',
    params = {}
  } = options;
  return new Promise((resolve, reject) => {
    $axios({
      method,
      url,
      params
    }).then(res => {
      resolve(res.data)
    }).catch(err => {
      resolve(false)
    })
  })
}
 
const apis = {
  verifyTodayStatus: {
    url: '/get_today_status',
    method: 'get',
    description: '获取今天是否签到'
  },
  checkIn: {
    url: '/check_in',
    method: 'post',
    description: '开始签到'
  },
  getSignInfo: {
    url: '/get_counts',
    method: 'get',
    description: '获取签到天数状态'
  },
  getPointCount: {
    url: '/get_cur_point',
    method: 'get',
    description: '获取当前矿石数'
  },
  getLuckyInfo: {
    url: '/lottery_lucky/my_lucky',
    method: 'post',
    description: '获取幸运抽奖我的状态'
  },
  getFreeCount: {
    url: '/lottery_config/get',
    method: 'get',
    description: '获取免费次数'
  },
  dipLucky: {
    url: '/lottery_lucky/dip_lucky',
    method: 'post',
    description: '沾喜气',
    params: {
      lottery_history_id: '7090346718260101131'
    }
  },
  startLottery: {
    url: '/lottery/draw',
    method: 'post',
    description: '开始抽奖'
  },
}
 
const check_in_juejin = async () => {
  let finalResult = {
    checkInStatus: false,
    continuousDay: 0,
    totalDay: 0,
    oreCount: 0,
    prize: '',
    LuckyValue: 0
  }
  let res_verifyTodayStatus = await _http(apis.verifyTodayStatus);
  if (res_verifyTodayStatus.err_no != 0) {
    console.log('==================掘金脚本失败咯~应该需要更新cookie啦!===================')
    return;
  }

  // 脚本执行过审
const messageCounturl = 'https://api.juejin.cn/interact_api/v1/message/count';
const messageCountParams = {
  aid: '2608',
  uuid: '7096818251988633099',
  spider: '0'
};
const messageCountHeaders = {
  'Content-Type': 'application/json',
  'Cookie': juejin_cookie,
  'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  'Sec-Ch-Ua-Mobile':'?0',
  'Sec-Ch-Ua-Platform':'"Windows"',
  'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
};
axios.get(messageCounturl, {params: messageCountParams, headers: messageCountHeaders })
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error('Error 避审失败:', error);
  });

  if (!res_verifyTodayStatus.data) {
    let res_checkIn = await _http(apis.checkIn);
    if (res_checkIn.err_no == 0) {
      finalResult.checkInStatus = true
    }
  } else {
    finalResult.checkInStatus = true
  }
 
  await _http(apis.dipLucky); // 沾喜气
  let res_getFreeCount = await _http(apis.getFreeCount);
  if (res_getFreeCount.data.free_count != 0) {
    let res_startLottery = await _http(apis.startLottery); // 执行免费抽奖
    if (res_startLottery.err_no == 0) {
      finalResult.prize = res_startLottery.data.lottery_name
    }
  } else {
    finalResult.prize = null
  }
  let temp_user_info = await Promise.all([_http(apis.getSignInfo), _http(apis.getPointCount), _http(apis.getLuckyInfo)]);
  let [res_getSignInfo, res_getPointCount, res_getLuckyInfo] = [...temp_user_info];
  finalResult.oreCount = res_getPointCount.data
  finalResult.continuousDay = res_getSignInfo.data.cont_count;
  finalResult.totalDay = res_getSignInfo.data.sum_count;
  finalResult.LuckyValue = res_getLuckyInfo.data.total_value;
  let text =
    `
今日签到成功, 已连续签到 [ ${finalResult.continuousDay} ], 累计签到 [ ${finalResult.totalDay} ], 当前拥有矿石 [ ${finalResult.oreCount} ]
今日免费抽奖成功, ${finalResult.prize? '抽中奖品 [ '+ finalResult.prize +' ], '  : ''}已累计幸运值 [ ${finalResult.LuckyValue}/6000 ]
`
  console.log(text)
}
 
check_in_juejin();