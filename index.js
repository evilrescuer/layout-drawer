import LayoutDrawer from './layout-drawer'
import { noop } from 'lodash';

const data1 = {
    "title": "昨夜今晨 | 多家制造业公司“跨界”生产口罩；瑞德西韦正处于临床试验阶段",
    "paragraphs": []
};

for (let i=0; i<118; i++) {
    data1.paragraphs.push({
        "type": "text",
        "context": `${i + 1}亲爱的读者和听众朋友，经过一个漫长的假期，“昨夜今晨发生了什么”恢复更新。疫情期间，我们将把Breaking News设为“疫情新闻专区”，同时继续向大家提供有价值的商业新闻。在这里拜个晚年，祝大家平安健康。`
    });
}

for (let i=0; i<50; i++) {
    data1.paragraphs.push({
        "type": "img",
        "src": `http://a4.att.hudong.com/21/09/01200000026352136359091694357.jpg`
    });
}

const layoutDrawer = new LayoutDrawer();
layoutDrawer.parse(data1).then(noop);
