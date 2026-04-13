/**
 * 中国省市区数据
 * 包含34个省级行政区及其主要城市
 */

export interface City {
  id: string;
  name: string;
  nameEn: string;
}

export interface Province {
  id: string;
  name: string;
  nameEn: string;
  cities: City[];
}

/**
 * 中国省市区数据（34个省级行政区）
 * 4个直辖市 + 23个省 + 5个自治区 + 2个特别行政区
 */
export const CHINA_REGIONS: Province[] = [
  // ==================== 4个直辖市 ====================
  {
    id: 'beijing',
    name: '北京',
    nameEn: 'Beijing',
    cities: [
      { id: 'beijing', name: '北京市', nameEn: 'Beijing' },
    ],
  },
  {
    id: 'tianjin',
    name: '天津',
    nameEn: 'Tianjin',
    cities: [
      { id: 'tianjin', name: '天津市', nameEn: 'Tianjin' },
    ],
  },
  {
    id: 'shanghai',
    name: '上海',
    nameEn: 'Shanghai',
    cities: [
      { id: 'shanghai', name: '上海市', nameEn: 'Shanghai' },
    ],
  },
  {
    id: 'chongqing',
    name: '重庆',
    nameEn: 'Chongqing',
    cities: [
      { id: 'chongqing', name: '重庆市', nameEn: 'Chongqing' },
    ],
  },

  // ==================== 23个省 ====================
  {
    id: 'hebei',
    name: '河北',
    nameEn: 'Hebei',
    cities: [
      { id: 'shijiazhuang', name: '石家庄', nameEn: 'Shijiazhuang' },
      { id: 'tangshan', name: '唐山', nameEn: 'Tangshan' },
      { id: 'qinhuangdao', name: '秦皇岛', nameEn: 'Qinhuangdao' },
      { id: 'handan', name: '邯郸', nameEn: 'Handan' },
      { id: 'xingtai', name: '邢台', nameEn: 'Xingtai' },
      { id: 'baoding', name: '保定', nameEn: 'Baoding' },
      { id: 'zhangjiakou', name: '张家口', nameEn: 'Zhangjiakou' },
      { id: 'chengde', name: '承德', nameEn: 'Chengde' },
      { id: 'cangzhou', name: '沧州', nameEn: 'Cangzhou' },
      { id: 'langfang', name: '廊坊', nameEn: 'Langfang' },
      { id: 'hengshui', name: '衡水', nameEn: 'Hengshui' },
    ],
  },
  {
    id: 'shanxi',
    name: '山西',
    nameEn: 'Shanxi',
    cities: [
      { id: 'taiyuan', name: '太原', nameEn: 'Taiyuan' },
      { id: 'datong', name: '大同', nameEn: 'Datong' },
      { id: 'yangquan', name: '阳泉', nameEn: 'Yangquan' },
      { id: 'changzhi', name: '长治', nameEn: 'Changzhi' },
      { id: 'jincheng', name: '晋城', nameEn: 'Jincheng' },
      { id: 'shuozhou', name: '朔州', nameEn: 'Shuozhou' },
      { id: 'jinzhong', name: '晋中', nameEn: 'Jinzhong' },
      { id: 'yuncheng', name: '运城', nameEn: 'Yuncheng' },
      { id: 'xinzhou', name: '忻州', nameEn: 'Xinzhou' },
      { id: 'linfen', name: '临汾', nameEn: 'Linfen' },
      { id: 'lvliang', name: '吕梁', nameEn: 'Lvliang' },
    ],
  },
  {
    id: 'liaoning',
    name: '辽宁',
    nameEn: 'Liaoning',
    cities: [
      { id: 'shenyang', name: '沈阳', nameEn: 'Shenyang' },
      { id: 'dalian', name: '大连', nameEn: 'Dalian' },
      { id: 'anshan', name: '鞍山', nameEn: 'Anshan' },
      { id: 'fushun', name: '抚顺', nameEn: 'Fushun' },
      { id: 'benxi', name: '本溪', nameEn: 'Benxi' },
      { id: 'dandong', name: '丹东', nameEn: 'Dandong' },
      { id: 'jinzhou', name: '锦州', nameEn: 'Jinzhou' },
      { id: 'yingkou', name: '营口', nameEn: 'Yingkou' },
      { id: 'fuxin', name: '阜新', nameEn: 'Fuxin' },
      { id: 'liaoyang', name: '辽阳', nameEn: 'Liaoyang' },
      { id: 'panjin', name: '盘锦', nameEn: 'Panjin' },
      { id: 'tieling', name: '铁岭', nameEn: 'Tieling' },
      { id: 'chaoyang', name: '朝阳', nameEn: 'Chaoyang' },
      { id: 'huludao', name: '葫芦岛', nameEn: 'Huludao' },
    ],
  },
  {
    id: 'jilin',
    name: '吉林',
    nameEn: 'Jilin',
    cities: [
      { id: 'changchun', name: '长春', nameEn: 'Changchun' },
      { id: 'jilin-city', name: '吉林', nameEn: 'Jilin' },
      { id: 'siping', name: '四平', nameEn: 'Siping' },
      { id: 'liaoyuan', name: '辽源', nameEn: 'Liaoyuan' },
      { id: 'tonghua', name: '通化', nameEn: 'Tonghua' },
      { id: 'baishan', name: '白山', nameEn: 'Baishan' },
      { id: 'songyuan', name: '松原', nameEn: 'Songyuan' },
      { id: 'baicheng', name: '白城', nameEn: 'Baicheng' },
      { id: 'yanbian', name: '延边', nameEn: 'Yanbian' },
    ],
  },
  {
    id: 'heilongjiang',
    name: '黑龙江',
    nameEn: 'Heilongjiang',
    cities: [
      { id: 'harbin', name: '哈尔滨', nameEn: 'Harbin' },
      { id: 'qiqihar', name: '齐齐哈尔', nameEn: 'Qiqihar' },
      { id: 'jixi', name: '鸡西', nameEn: 'Jixi' },
      { id: 'hegang', name: '鹤岗', nameEn: 'Hegang' },
      { id: 'shuangyashan', name: '双鸭山', nameEn: 'Shuangyashan' },
      { id: 'daqing', name: '大庆', nameEn: 'Daqing' },
      { id: 'yichun', name: '伊春', nameEn: 'Yichun' },
      { id: 'jiamusi', name: '佳木斯', nameEn: 'Jiamusi' },
      { id: 'qitaihe', name: '七台河', nameEn: 'Qitaihe' },
      { id: 'mudanjiang', name: '牡丹江', nameEn: 'Mudanjiang' },
      { id: 'heihe', name: '黑河', nameEn: 'Heihe' },
      { id: 'suihua', name: '绥化', nameEn: 'Suihua' },
      { id: 'daxinganling', name: '大兴安岭', nameEn: 'Daxinganling' },
    ],
  },
  {
    id: 'jiangsu',
    name: '江苏',
    nameEn: 'Jiangsu',
    cities: [
      { id: 'nanjing', name: '南京', nameEn: 'Nanjing' },
      { id: 'wuxi', name: '无锡', nameEn: 'Wuxi' },
      { id: 'xuzhou', name: '徐州', nameEn: 'Xuzhou' },
      { id: 'changzhou', name: '常州', nameEn: 'Changzhou' },
      { id: 'suzhou', name: '苏州', nameEn: 'Suzhou' },
      { id: 'nantong', name: '南通', nameEn: 'Nantong' },
      { id: 'lianyungang', name: '连云港', nameEn: 'Lianyungang' },
      { id: 'huaian', name: '淮安', nameEn: "Huai'an" },
      { id: 'yancheng', name: '盐城', nameEn: 'Yancheng' },
      { id: 'yangzhou', name: '扬州', nameEn: 'Yangzhou' },
      { id: 'zhenjiang', name: '镇江', nameEn: 'Zhenjiang' },
      { id: 'taizhou', name: '泰州', nameEn: 'Taizhou' },
      { id: 'suqian', name: '宿迁', nameEn: 'Suqian' },
    ],
  },
  {
    id: 'zhejiang',
    name: '浙江',
    nameEn: 'Zhejiang',
    cities: [
      { id: 'hangzhou', name: '杭州', nameEn: 'Hangzhou' },
      { id: 'ningbo', name: '宁波', nameEn: 'Ningbo' },
      { id: 'wenzhou', name: '温州', nameEn: 'Wenzhou' },
      { id: 'jiaxing', name: '嘉兴', nameEn: 'Jiaxing' },
      { id: 'huzhou', name: '湖州', nameEn: 'Huzhou' },
      { id: 'shaoxing', name: '绍兴', nameEn: 'Shaoxing' },
      { id: 'jinhua', name: '金华', nameEn: 'Jinhua' },
      { id: 'quzhou', name: '衢州', nameEn: 'Quzhou' },
      { id: 'zhoushan', name: '舟山', nameEn: 'Zhoushan' },
      { id: 'taizhou-zj', name: '台州', nameEn: 'Taizhou' },
      { id: 'lishui', name: '丽水', nameEn: 'Lishui' },
    ],
  },
  {
    id: 'anhui',
    name: '安徽',
    nameEn: 'Anhui',
    cities: [
      { id: 'hefei', name: '合肥', nameEn: 'Hefei' },
      { id: 'wuhu', name: '芜湖', nameEn: 'Wuhu' },
      { id: 'bengbu', name: '蚌埠', nameEn: 'Bengbu' },
      { id: 'huainan', name: '淮南', nameEn: 'Huainan' },
      { id: 'maanshan', name: '马鞍山', nameEn: "Ma'anshan" },
      { id: 'huaibei', name: '淮北', nameEn: 'Huaibei' },
      { id: 'tongling', name: '铜陵', nameEn: 'Tongling' },
      { id: 'anqing', name: '安庆', nameEn: 'Anqing' },
      { id: 'huangshan', name: '黄山', nameEn: 'Huangshan' },
      { id: 'chuzhou', name: '滁州', nameEn: 'Chuzhou' },
      { id: 'fuyang', name: '阜阳', nameEn: 'Fuyang' },
      { id: 'suzhou-ah', name: '宿州', nameEn: 'Suzhou' },
      { id: 'luan', name: '六安', nameEn: "Lu'an" },
      { id: 'bozhou', name: '亳州', nameEn: 'Bozhou' },
      { id: 'chizhou', name: '池州', nameEn: 'Chizhou' },
      { id: 'xuancheng', name: '宣城', nameEn: 'Xuancheng' },
    ],
  },
  {
    id: 'fujian',
    name: '福建',
    nameEn: 'Fujian',
    cities: [
      { id: 'fuzhou', name: '福州', nameEn: 'Fuzhou' },
      { id: 'xiamen', name: '厦门', nameEn: 'Xiamen' },
      { id: 'putian', name: '莆田', nameEn: 'Putian' },
      { id: 'sanming', name: '三明', nameEn: 'Sanming' },
      { id: 'quanzhou', name: '泉州', nameEn: 'Quanzhou' },
      { id: 'zhangzhou', name: '漳州', nameEn: 'Zhangzhou' },
      { id: 'nanping', name: '南平', nameEn: 'Nanping' },
      { id: 'longyan', name: '龙岩', nameEn: 'Longyan' },
      { id: 'ningde', name: '宁德', nameEn: 'Ningde' },
    ],
  },
  {
    id: 'jiangxi',
    name: '江西',
    nameEn: 'Jiangxi',
    cities: [
      { id: 'nanchang', name: '南昌', nameEn: 'Nanchang' },
      { id: 'jingdezhen', name: '景德镇', nameEn: 'Jingdezhen' },
      { id: 'pingxiang', name: '萍乡', nameEn: 'Pingxiang' },
      { id: 'jiujiang', name: '九江', nameEn: 'Jiujiang' },
      { id: 'xinyu', name: '新余', nameEn: 'Xinyu' },
      { id: 'yingtan', name: '鹰潭', nameEn: 'Yingtan' },
      { id: 'ganzhou', name: '赣州', nameEn: 'Ganzhou' },
      { id: 'jian', name: '吉安', nameEn: "Ji'an" },
      { id: 'yichun-jx', name: '宜春', nameEn: 'Yichun' },
      { id: 'fuzhou-jx', name: '抚州', nameEn: 'Fuzhou' },
      { id: 'shangrao', name: '上饶', nameEn: 'Shangrao' },
    ],
  },
  {
    id: 'shandong',
    name: '山东',
    nameEn: 'Shandong',
    cities: [
      { id: 'jinan', name: '济南', nameEn: 'Jinan' },
      { id: 'qingdao', name: '青岛', nameEn: 'Qingdao' },
      { id: 'zibo', name: '淄博', nameEn: 'Zibo' },
      { id: 'zaozhuang', name: '枣庄', nameEn: 'Zaozhuang' },
      { id: 'dongying', name: '东营', nameEn: 'Dongying' },
      { id: 'yantai', name: '烟台', nameEn: 'Yantai' },
      { id: 'weifang', name: '潍坊', nameEn: 'Weifang' },
      { id: 'jining', name: '济宁', nameEn: 'Jining' },
      { id: 'tai', name: '泰安', nameEn: "Tai'an" },
      { id: 'weihai', name: '威海', nameEn: 'Weihai' },
      { id: 'rizhao', name: '日照', nameEn: 'Rizhao' },
      { id: 'linyi', name: '临沂', nameEn: 'Linyi' },
      { id: 'dezhou', name: '德州', nameEn: 'Dezhou' },
      { id: 'liaocheng', name: '聊城', nameEn: 'Liaocheng' },
      { id: 'binzhou', name: '滨州', nameEn: 'Binzhou' },
      { id: 'heze', name: '菏泽', nameEn: 'Heze' },
    ],
  },
  {
    id: 'henan',
    name: '河南',
    nameEn: 'Henan',
    cities: [
      { id: 'zhengzhou', name: '郑州', nameEn: 'Zhengzhou' },
      { id: 'kaifeng', name: '开封', nameEn: 'Kaifeng' },
      { id: 'luoyang', name: '洛阳', nameEn: 'Luoyang' },
      { id: 'pingdingshan', name: '平顶山', nameEn: 'Pingdingshan' },
      { id: 'anyang', name: '安阳', nameEn: 'Anyang' },
      { id: 'hebi', name: '鹤壁', nameEn: 'Hebi' },
      { id: 'xinxiang', name: '新乡', nameEn: 'Xinxiang' },
      { id: 'jiaozuo', name: '焦作', nameEn: 'Jiaozuo' },
      { id: 'puyang', name: '濮阳', nameEn: 'Puyang' },
      { id: 'xuchang', name: '许昌', nameEn: 'Xuchang' },
      { id: 'luohe', name: '漯河', nameEn: 'Luohe' },
      { id: 'sanmenxia', name: '三门峡', nameEn: 'Sanmenxia' },
      { id: 'nanyang', name: '南阳', nameEn: 'Nanyang' },
      { id: 'shangqiu', name: '商丘', nameEn: 'Shangqiu' },
      { id: 'xinyang', name: '信阳', nameEn: 'Xinyang' },
      { id: 'zhoukou', name: '周口', nameEn: 'Zhoukou' },
      { id: 'zhumadian', name: '驻马店', nameEn: 'Zhumadian' },
      { id: 'jiyuan', name: '济源', nameEn: 'Jiyuan' },
    ],
  },
  {
    id: 'hubei',
    name: '湖北',
    nameEn: 'Hubei',
    cities: [
      { id: 'wuhan', name: '武汉', nameEn: 'Wuhan' },
      { id: 'huangshi', name: '黄石', nameEn: 'Huangshi' },
      { id: 'shiyan', name: '十堰', nameEn: 'Shiyan' },
      { id: 'yichang-hb', name: '宜昌', nameEn: 'Yichang' },
      { id: 'xiangyang', name: '襄阳', nameEn: 'Xiangyang' },
      { id: 'ezhou', name: '鄂州', nameEn: 'Ezhou' },
      { id: 'jingmen', name: '荆门', nameEn: 'Jingmen' },
      { id: 'xiaogan', name: '孝感', nameEn: 'Xiaogan' },
      { id: 'jingzhou', name: '荆州', nameEn: 'Jingzhou' },
      { id: 'huanggang', name: '黄冈', nameEn: 'Huanggang' },
      { id: 'xianning', name: '咸宁', nameEn: 'Xianning' },
      { id: 'suizhou', name: '随州', nameEn: 'Suizhou' },
      { id: 'enshi', name: '恩施', nameEn: 'Enshi' },
      { id: 'xiantao', name: '仙桃', nameEn: 'Xiantao' },
      { id: 'qianjiang', name: '潜江', nameEn: 'Qianjiang' },
      { id: 'tianmen', name: '天门', nameEn: 'Tianmen' },
      { id: 'shennongjia', name: '神农架', nameEn: 'Shennongjia' },
    ],
  },
  {
    id: 'hunan',
    name: '湖南',
    nameEn: 'Hunan',
    cities: [
      { id: 'changsha', name: '长沙', nameEn: 'Changsha' },
      { id: 'zhuzhou', name: '株洲', nameEn: 'Zhuzhou' },
      { id: 'xiangtan', name: '湘潭', nameEn: 'Xiangtan' },
      { id: 'hengyang', name: '衡阳', nameEn: 'Hengyang' },
      { id: 'shaoyang', name: '邵阳', nameEn: 'Shaoyang' },
      { id: 'yueyang', name: '岳阳', nameEn: 'Yueyang' },
      { id: 'changde', name: '常德', nameEn: 'Changde' },
      { id: 'zhangjiajie', name: '张家界', nameEn: 'Zhangjiajie' },
      { id: 'yiyang', name: '益阳', nameEn: 'Yiyang' },
      { id: 'chenzhou', name: '郴州', nameEn: 'Chenzhou' },
      { id: 'yongzhou', name: '永州', nameEn: 'Yongzhou' },
      { id: 'huaihua', name: '怀化', nameEn: 'Huaihua' },
      { id: 'loudi', name: '娄底', nameEn: 'Loudi' },
      { id: 'xiangxi', name: '湘西', nameEn: 'Xiangxi' },
    ],
  },
  {
    id: 'guangdong',
    name: '广东',
    nameEn: 'Guangdong',
    cities: [
      { id: 'guangzhou', name: '广州', nameEn: 'Guangzhou' },
      { id: 'shaoguan', name: '韶关', nameEn: 'Shaoguan' },
      { id: 'shenzhen', name: '深圳', nameEn: 'Shenzhen' },
      { id: 'zhuhai', name: '珠海', nameEn: 'Zhuhai' },
      { id: 'shantou', name: '汕头', nameEn: 'Shantou' },
      { id: 'foshan', name: '佛山', nameEn: 'Foshan' },
      { id: 'jiangmen', name: '江门', nameEn: 'Jiangmen' },
      { id: 'zhanjiang', name: '湛江', nameEn: 'Zhanjiang' },
      { id: 'maoming', name: '茂名', nameEn: 'Maoming' },
      { id: 'zhaoqing', name: '肇庆', nameEn: 'Zhaoqing' },
      { id: 'huizhou', name: '惠州', nameEn: 'Huizhou' },
      { id: 'meizhou', name: '梅州', nameEn: 'Meizhou' },
      { id: 'shanwei', name: '汕尾', nameEn: 'Shanwei' },
      { id: 'heyuan', name: '河源', nameEn: 'Heyuan' },
      { id: 'yangjiang', name: '阳江', nameEn: 'Yangjiang' },
      { id: 'qingyuan', name: '清远', nameEn: 'Qingyuan' },
      { id: 'dongguan', name: '东莞', nameEn: 'Dongguan' },
      { id: 'zhongshan', name: '中山', nameEn: 'Zhongshan' },
      { id: 'chaozhou', name: '潮州', nameEn: 'Chaozhou' },
      { id: 'jieyang', name: '揭阳', nameEn: 'Jieyang' },
      { id: 'yunfu', name: '云浮', nameEn: 'Yunfu' },
    ],
  },
  {
    id: 'hainan',
    name: '海南',
    nameEn: 'Hainan',
    cities: [
      { id: 'haikou', name: '海口', nameEn: 'Haikou' },
      { id: 'sanya', name: '三亚', nameEn: 'Sanya' },
      { id: 'sansha', name: '三沙', nameEn: 'Sansha' },
      { id: 'danzhou', name: '儋州', nameEn: 'Danzhou' },
    ],
  },
  {
    id: 'sichuan',
    name: '四川',
    nameEn: 'Sichuan',
    cities: [
      { id: 'chengdu', name: '成都', nameEn: 'Chengdu' },
      { id: 'zigong', name: '自贡', nameEn: 'Zigong' },
      { id: 'panzhihua', name: '攀枝花', nameEn: 'Panzhihua' },
      { id: 'luzhou', name: '泸州', nameEn: 'Luzhou' },
      { id: 'deyang', name: '德阳', nameEn: 'Deyang' },
      { id: 'mianyang', name: '绵阳', nameEn: 'Mianyang' },
      { id: 'guangyuan', name: '广元', nameEn: 'Guangyuan' },
      { id: 'suining', name: '遂宁', nameEn: 'Suining' },
      { id: 'neijiang', name: '内江', nameEn: 'Neijiang' },
      { id: 'leshan', name: '乐山', nameEn: 'Leshan' },
      { id: 'nanchong', name: '南充', nameEn: 'Nanchong' },
      { id: 'meishan', name: '眉山', nameEn: 'Meishan' },
      { id: 'yibin', name: '宜宾', nameEn: 'Yibin' },
      { id: 'guangan', name: '广安', nameEn: "Guang'an" },
      { id: 'dazhou', name: '达州', nameEn: 'Dazhou' },
      { id: 'yaan', name: '雅安', nameEn: "Ya'an" },
      { id: 'bazhong', name: '巴中', nameEn: 'Bazhong' },
      { id: 'ziyang', name: '资阳', nameEn: 'Ziyang' },
      { id: 'aba', name: '阿坝', nameEn: 'Aba' },
      { id: 'ganzi', name: '甘孜', nameEn: 'Ganzi' },
      { id: 'liangshan', name: '凉山', nameEn: 'Liangshan' },
    ],
  },
  {
    id: 'guizhou',
    name: '贵州',
    nameEn: 'Guizhou',
    cities: [
      { id: 'guiyang', name: '贵阳', nameEn: 'Guiyang' },
      { id: 'liupanshui', name: '六盘水', nameEn: 'Liupanshui' },
      { id: 'zunyi', name: '遵义', nameEn: 'Zunyi' },
      { id: 'anshun', name: '安顺', nameEn: 'Anshun' },
      { id: 'bijie', name: '毕节', nameEn: 'Bijie' },
      { id: 'tongren', name: '铜仁', nameEn: 'Tongren' },
      { id: 'qiannan', name: '黔南', nameEn: 'Qiannan' },
      { id: 'qiandongnan', name: '黔东南', nameEn: 'Qiandongnan' },
      { id: 'qianxinan', name: '黔西南', nameEn: 'Qianxinan' },
    ],
  },
  {
    id: 'yunnan',
    name: '云南',
    nameEn: 'Yunnan',
    cities: [
      { id: 'kunming', name: '昆明', nameEn: 'Kunming' },
      { id: 'qujing', name: '曲靖', nameEn: 'Qujing' },
      { id: 'yuxi', name: '玉溪', nameEn: 'Yuxi' },
      { id: 'baoshan', name: '保山', nameEn: 'Baoshan' },
      { id: 'zhaotong', name: '昭通', nameEn: 'Zhaotong' },
      { id: 'lijiang', name: '丽江', nameEn: 'Lijiang' },
      { id: 'pu', name: '普洱', nameEn: "Pu'er" },
      { id: 'lincang', name: '临沧', nameEn: 'Lincang' },
      { id: 'chuxiong', name: '楚雄', nameEn: 'Chuxiong' },
      { id: 'honghe', name: '红河', nameEn: 'Honghe' },
      { id: 'wenshan', name: '文山', nameEn: 'Wenshan' },
      { id: 'xishuangbanna', name: '西双版纳', nameEn: 'Xishuangbanna' },
      { id: 'dali', name: '大理', nameEn: 'Dali' },
      { id: 'dehong', name: '德宏', nameEn: 'Dehong' },
      { id: 'nujiang', name: '怒江', nameEn: 'Nujiang' },
      { id: 'diqing', name: '迪庆', nameEn: 'Diqing' },
    ],
  },
  {
    id: 'shaanxi',
    name: '陕西',
    nameEn: 'Shaanxi',
    cities: [
      { id: 'xian', name: '西安', nameEn: "Xi'an" },
      { id: 'tongchuan', name: '铜川', nameEn: 'Tongchuan' },
      { id: 'baoji', name: '宝鸡', nameEn: 'Baoji' },
      { id: 'xianyang', name: '咸阳', nameEn: 'Xianyang' },
      { id: 'weinan', name: '渭南', nameEn: 'Weinan' },
      { id: 'yanan', name: '延安', nameEn: "Yan'an" },
      { id: 'hanzhong', name: '汉中', nameEn: 'Hanzhong' },
      { id: 'yulin', name: '榆林', nameEn: 'Yulin' },
      { id: 'ankang', name: '安康', nameEn: 'Ankang' },
      { id: 'shangluo', name: '商洛', nameEn: 'Shangluo' },
    ],
  },
  {
    id: 'gansu',
    name: '甘肃',
    nameEn: 'Gansu',
    cities: [
      { id: 'lanzhou', name: '兰州', nameEn: 'Lanzhou' },
      { id: 'jiayuguan', name: '嘉峪关', nameEn: 'Jiayuguan' },
      { id: 'jinchang', name: '金昌', nameEn: 'Jinchang' },
      { id: 'baiyin', name: '白银', nameEn: 'Baiyin' },
      { id: 'tianshui', name: '天水', nameEn: 'Tianshui' },
      { id: 'wuwei', name: '武威', nameEn: 'Wuwei' },
      { id: 'zhangye', name: '张掖', nameEn: 'Zhangye' },
      { id: 'pingliang', name: '平凉', nameEn: 'Pingliang' },
      { id: 'jiuquan', name: '酒泉', nameEn: 'Jiuquan' },
      { id: 'qingyang', name: '庆阳', nameEn: 'Qingyang' },
      { id: 'dingxi', name: '定西', nameEn: 'Dingxi' },
      { id: 'longnan', name: '陇南', nameEn: 'Longnan' },
      { id: 'linxia', name: '临夏', nameEn: 'Linxia' },
      { id: 'gannan', name: '甘南', nameEn: 'Gannan' },
    ],
  },
  {
    id: 'qinghai',
    name: '青海',
    nameEn: 'Qinghai',
    cities: [
      { id: 'xining', name: '西宁', nameEn: 'Xining' },
      { id: 'haidong', name: '海东', nameEn: 'Haidong' },
      { id: 'haibei', name: '海北', nameEn: 'Haibei' },
      { id: 'huangnan', name: '黄南', nameEn: 'Huangnan' },
      { id: 'hainan-qh', name: '海南', nameEn: 'Hainan' },
      { id: 'guoluo', name: '果洛', nameEn: 'Guoluo' },
      { id: 'yushu', name: '玉树', nameEn: 'Yushu' },
      { id: 'haixi', name: '海西', nameEn: 'Haixi' },
    ],
  },
  {
    id: 'taiwan',
    name: '台湾',
    nameEn: 'Taiwan',
    cities: [
      { id: 'taipei', name: '台北', nameEn: 'Taipei' },
      { id: 'kaohsiung', name: '高雄', nameEn: 'Kaohsiung' },
      { id: 'tainan', name: '台南', nameEn: 'Tainan' },
      { id: 'taichung', name: '台中', nameEn: 'Taichung' },
      { id: 'new-taipei', name: '新北', nameEn: 'New Taipei' },
      { id: 'taoyuan', name: '桃园', nameEn: 'Taoyuan' },
    ],
  },

  // ==================== 5个自治区 ====================
  {
    id: 'neimenggu',
    name: '内蒙古',
    nameEn: 'Inner Mongolia',
    cities: [
      { id: 'huhehaote', name: '呼和浩特', nameEn: 'Hohhot' },
      { id: 'baotou', name: '包头', nameEn: 'Baotou' },
      { id: 'wuhai', name: '乌海', nameEn: 'Wuhai' },
      { id: 'chifeng', name: '赤峰', nameEn: 'Chifeng' },
      { id: 'tongliao', name: '通辽', nameEn: 'Tongliao' },
      { id: 'eerduosi', name: '鄂尔多斯', nameEn: 'Ordos' },
      { id: 'hulunbeier', name: '呼伦贝尔', nameEn: 'Hulunbuir' },
      { id: 'bayannaoer', name: '巴彦淖尔', nameEn: 'Bayannur' },
      { id: 'wulanchabu', name: '乌兰察布', nameEn: 'Ulanqab' },
      { id: 'xingan', name: '兴安盟', nameEn: 'Xingan' },
      { id: 'xilinguole', name: '锡林郭勒', nameEn: 'Xilingol' },
      { id: 'alashan', name: '阿拉善', nameEn: 'Alxa' },
    ],
  },
  {
    id: 'guangxi',
    name: '广西',
    nameEn: 'Guangxi',
    cities: [
      { id: 'nanning', name: '南宁', nameEn: 'Nanning' },
      { id: 'liuzhou', name: '柳州', nameEn: 'Liuzhou' },
      { id: 'guilin', name: '桂林', nameEn: 'Guilin' },
      { id: 'wuzhou', name: '梧州', nameEn: 'Wuzhou' },
      { id: 'beihai', name: '北海', nameEn: 'Beihai' },
      { id: 'fangchenggang', name: '防城港', nameEn: 'Fangchenggang' },
      { id: 'qinzhou', name: '钦州', nameEn: 'Qinzhou' },
      { id: 'guigang', name: '贵港', nameEn: 'Guigang' },
      { id: 'yulin-gx', name: '玉林', nameEn: 'Yulin' },
      { id: 'baise', name: '百色', nameEn: 'Baise' },
      { id: 'hezhou', name: '贺州', nameEn: 'Hezhou' },
      { id: 'hechi', name: '河池', nameEn: 'Hechi' },
      { id: 'laibin', name: '来宾', nameEn: 'Laibin' },
      { id: 'chongzuo', name: '崇左', nameEn: 'Chongzuo' },
    ],
  },
  {
    id: 'xizang',
    name: '西藏',
    nameEn: 'Tibet',
    cities: [
      { id: 'lasa', name: '拉萨', nameEn: 'Lhasa' },
      { id: 'rikaze', name: '日喀则', nameEn: 'Shigatse' },
      { id: 'changdu', name: '昌都', nameEn: 'Chamdo' },
      { id: 'nyingchi', name: '林芝', nameEn: 'Nyingchi' },
      { id: 'shannan', name: '山南', nameEn: 'Shannan' },
      { id: 'naqu', name: '那曲', nameEn: 'Nagqu' },
      { id: 'ali', name: '阿里', nameEn: 'Ngari' },
    ],
  },
  {
    id: 'ningxia',
    name: '宁夏',
    nameEn: 'Ningxia',
    cities: [
      { id: 'yinchuan', name: '银川', nameEn: 'Yinchuan' },
      { id: 'shizuishan', name: '石嘴山', nameEn: 'Shizuishan' },
      { id: 'wuzhong', name: '吴忠', nameEn: 'Wuzhong' },
      { id: 'guyuan', name: '固原', nameEn: 'Guyuan' },
      { id: 'zhongwei', name: '中卫', nameEn: 'Zhongwei' },
    ],
  },
  {
    id: 'xinjiang',
    name: '新疆',
    nameEn: 'Xinjiang',
    cities: [
      { id: 'urumqi', name: '乌鲁木齐', nameEn: 'Urumqi' },
      { id: 'kelamayi', name: '克拉玛依', nameEn: 'Karamay' },
      { id: 'turpan', name: '吐鲁番', nameEn: 'Turpan' },
      { id: 'hami', name: '哈密', nameEn: 'Hami' },
      { id: 'changji', name: '昌吉', nameEn: 'Changji' },
      { id: 'boertala', name: '博尔塔拉', nameEn: 'Bortala' },
      { id: 'bayinguoleng', name: '巴音郭楞', nameEn: 'Bayingolin' },
      { id: 'akesu', name: '阿克苏', nameEn: 'Aksu' },
      { id: 'kezilesu', name: '克孜勒苏', nameEn: 'Kizilsu' },
      { id: 'kashgar', name: '喀什', nameEn: 'Kashgar' },
      { id: 'hetian', name: '和田', nameEn: 'Hotan' },
      { id: 'ili', name: '伊犁', nameEn: 'Ili' },
      { id: 'tacheng', name: '塔城', nameEn: 'Tacheng' },
      { id: 'altay', name: '阿勒泰', nameEn: 'Altay' },
      { id: 'shihezi', name: '石河子', nameEn: 'Shihezi' },
    ],
  },

  // ==================== 2个特别行政区 ====================
  {
    id: 'hongkong',
    name: '香港',
    nameEn: 'Hong Kong',
    cities: [
      { id: 'hongkong', name: '香港', nameEn: 'Hong Kong' },
    ],
  },
  {
    id: 'macau',
    name: '澳门',
    nameEn: 'Macau',
    cities: [
      { id: 'macau', name: '澳门', nameEn: 'Macau' },
    ],
  },
];

/**
 * 获取所有省份列表（用于一级下拉）
 */
export const getAllProvinces = () => CHINA_REGIONS.map(p => ({
  id: p.id,
  name: p.name,
  nameEn: p.nameEn,
}));

/**
 * 根据省份ID获取城市列表（用于二级下拉）
 */
export const getCitiesByProvince = (provinceId: string) => {
  const province = CHINA_REGIONS.find(p => p.id === provinceId);
  return province ? province.cities : [];
};

/**
 * 根据城市ID查找城市信息
 */
export const getCityById = (cityId: string) => {
  for (const province of CHINA_REGIONS) {
    const city = province.cities.find(c => c.id === cityId);
    if (city) {
      return {
        ...city,
        provinceId: province.id,
        provinceName: province.name,
        provinceNameEn: province.nameEn,
      };
    }
  }
  return null;
};

/**
 * 根据省份ID获取省份信息
 */
export const getProvinceById = (provinceId: string) => {
  return CHINA_REGIONS.find(p => p.id === provinceId);
};