export default class TrackerUtil {
    constructor() {
        this.parseTime = [];
        this.renderTime = [];
        this.TYPE_MAPPING = {
            parse: {
                title: '解析',
                timeArr: this.parseTime,
            },
            render: {
                title: '渲染',
                timeArr: this.renderTime,
            }
        };
    }
    start(type, indexOfPage) {
        const { timeArr } = this.TYPE_MAPPING[type];
        timeArr[indexOfPage] = {
            startDate: new Date().getTime()
        };
    }
    end(type, indexOfPage) {
        const { title, timeArr } = this.TYPE_MAPPING[type];

        const destTime = timeArr[timeArr.length - 1];
        destTime.endDate = new Date().getTime();
        const costTime = destTime.endDate - destTime.startDate;
        destTime.costTime = costTime;
        console.log(`【${title}】第${indexOfPage + 1}页，耗时${costTime}ms`);
        if (type === 'render') console.log('------');
    }
    terminate() {
        // small fixed up
        this.parseTime.splice(this.parseTime.length - 1, 1);

        console.log('\n');
        for (let field in this.TYPE_MAPPING) {
            const { title, timeArr } = this.TYPE_MAPPING[field];
            const totalTime = timeArr.reduce((total, cur) => total + cur.costTime, 0);
            console.log(`【${title}】总共，耗时${totalTime}ms`);
        }
        console.log('\n【任务结束】');
    }
}
