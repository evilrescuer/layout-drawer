import _ from "lodash";
import TrackerUtil from "./utils/TrackerUtil";

const columnWidth = (document.body.clientWidth - 50 * 3) / 2;
const columnHeight = document.body.clientHeight - 50 * 2;
const imgHeight = 200;

export default class LayoutDrawer {
    constructor() {
        this.pages = [new Page()];
        this.indexOfPage = 0;
        this.currentAdditionalHeight = 0;
        this.currentElement = null;
        this.imgSrcs = [];
        this.tracker = new TrackerUtil();

        this.temp = document.createElement('DIV');
        this.temp.style.position = 'absolute';
        this.temp.style.top = '-1000px';
        this.temp.style.width = `${columnWidth}px`;
        this.temp.className = 'temp';
        document.body.appendChild(this.temp);
    }
    updateAdditionalHeight(marginTop = 0) {
        this.temp.innerHTML = '';
        this.temp.appendChild(this.currentElement);
        this.currentAdditionalHeight = marginTop + this.temp.offsetHeight;
    }
    async parse (data) {
        const { title, paragraphs } = data;
        this.renderTitle(title);
        const typeToParagraph = _.groupBy(paragraphs, 'type');
        const texts = typeToParagraph['text'].map(({ context }) => context);
        this.imgSrcs = typeToParagraph['img'].map(({ src }) => src);

        // first page
        this.tracker.start('parse', this.indexOfPage);

        for (let text of texts) {
            this.currentElement = document.createElement('DIV');
            this.currentElement.innerHTML = text;
            await this.traverse();
        }

        // last unfilled page
        await this.handleNotFullPage();
        this.tracker.terminate();
    }
    async traverse () {
        const page = this.pages[this.indexOfPage];
        if (page.isFull) {
            await this.handlePagePull();
        }
        else {
            for (let i=0; i < page.columns.length; i ++) {
                const column = page.columns[i];
                if (!column.isFull) {
                    this.updateAdditionalHeight(column.getMarginTop());
                    if (column.isEnoughToAdd(this.currentAdditionalHeight)) {
                        column.elements.push(this.currentElement);
                        column.usedHeight += this.currentAdditionalHeight;
                        break;
                    }
                    else {
                        column.isFull = true;
                        const [firstElement, secondElement] = column.splitElement(this.currentElement, this.temp);
                        if(firstElement) {
                            column.usedHeight += this.temp.offsetHeight;
                            column.elements.push(firstElement);
                            this.currentElement = secondElement;
                        }

                        if (i === page.columns.length - 1) {
                            page.isFull = true;
                            return await this.traverse();
                        }
                    }
                }
            }
        }
    }
    async traverseNextPage () {
        this.indexOfPage ++;
        this.tracker.start('parse', this.indexOfPage);
        await this.traverse();
    }
    async handlePagePull () {
        const page = this.pages[this.indexOfPage];
        this.tracker.end('parse', this.indexOfPage);

        const indicator = this.renderPage(page, this.indexOfPage);
        return await this.addLoadedPageListener(indicator);
    }
    addLoadedPageListener (indicator) {
        return new Promise ((resolve, reject) => {
            indicator.addEventListener('load', async () => {
                this.tracker.end('render', this.indexOfPage);
                this.pages.push(new Page());
                this.traverseNextPage().then(_ => {
                    resolve();
                });
            }, false);
        });
    }
    renderTitle (text) {
        const firstPage = this.pages[0].columns[0];
        const title = document.createElement('div');
        title.className = 'title';
        title.innerText = text;
        this.temp.appendChild(title);
        firstPage.elements.push(title);
        firstPage.usedHeight += this.temp.offsetHeight;
    }
    renderPage (page) {
        this.tracker.start('render', this.indexOfPage);

        const divPage = document.createElement('DIV');
        divPage.className = 'page';

        page.columns.forEach(({ elements }, columnIndex) => {
            const divColumn = document.createElement('DIV');
            const divColumnWrapper = document.createDocumentFragment();
            divColumn.className = 'column';

            elements.forEach((element, elementIndex) => {
                element.className = `element ${element.className}`;
                divColumnWrapper.appendChild(element);

                // template A
                if(columnIndex === 0 && elementIndex === 0) {
                    this.appendAnImage(divColumnWrapper);
                }
            });

            if(columnIndex === 0 && _.isEmpty(elements)) {
                this.appendAnImage(divColumnWrapper);
            }

            if(columnIndex === 1) {
                this.appendAnImage(divColumnWrapper);
            }

            divColumn.appendChild(divColumnWrapper);
            divPage.appendChild(divColumn);
        });
        const indicator = this.generateIndicator(divPage);

        document.body.appendChild(divPage);
        this.generatePageFooter();
        return indicator;
    }
    appendAnImage (divColumn) {
        if (this.imgSrcs.length > 0) {
            const imgSrc = this.imgSrcs.shift();
            const img = document.createElement('IMG');
            img.style.maxWidth = `${columnWidth}px`;
            img.style.height = `${imgHeight}px`;
            img.src = imgSrc;
            img.className = 'element';
            divColumn.appendChild(img);
        }
    }
    generateIndicator (divPage) {
        const indicator = document.createElement('style');
        divPage.appendChild(indicator);
        return indicator;
    }
    generatePageFooter () {
        const pageFooter = document.createElement('footer');
        pageFooter.className = 'footer';
        pageFooter.innerHTML = `---  ${this.indexOfPage + 1}  ---`;
        document.body.appendChild(pageFooter);
    }
    async handleNotFullPage () {
        if (!this.pages[this.pages.length - 1].isFull) {
            this.tracker.end('parse', this.indexOfPage);

            const indicator = this.renderPage(this.pages[this.pages.length - 1]);
            await this.addLoadedPageListener(indicator);
        }
    }
}

class Page {
    constructor() {
        this.columns = [new Column(), new Column()];
        this.isFull = false;
    }
}

class Column {
    constructor() {
        this.width = columnWidth;
        this.height = columnHeight;
        this.isFull = false;
        this.elements = [];

        this.usedHeight = imgHeight + 30;
    }
    isEnoughToAdd(additionalHeight) {
        return this.height >= this.usedHeight + additionalHeight;
    }
    isEmpty() {
        return _.isEmpty(this.elements);
    }
    getMarginTop () {
        return this.isEmpty() ? 0 : 30;
    }
    splitElement (element, tempElement) {
        const availableHeight = this.height - this.usedHeight - this.getMarginTop();
        // find suitable text
        let tempLength = element.innerText.length;
        while (tempLength > 0) {
            tempElement.innerHTML = element.innerText.substr(0, tempLength);
            if (tempElement.offsetHeight <= availableHeight) {
                break;
            }
            tempLength --;
        }
        return [
            generateTextWrapper(element.innerText.substr(0, tempLength)),
            generateTextWrapper(element.innerText.substr(tempLength)),
        ]
    }
}

function generateTextWrapper (text) {
    const wrapper = document.createElement('DIV');
    wrapper.innerText = text;
    return wrapper;
}
