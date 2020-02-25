import _ from "lodash";

const columnWidth = (document.body.clientWidth - 50 * 3) / 2;
const columnHeight = document.body.clientHeight - 50 * 2;
const imgHeight = 200;

export default class LayoutDrawer {
    constructor() {
        this.pages = [new Page()];
        this.indexOfPage = 0;
        this.indexOfColumn = 0;
        this.currentAdditionalHeight = 0;
        this.currentElement = null;
        this.imgSrcs = [];

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
        console.log('----', this.currentAdditionalHeight);
    }
    parse (data) {
        const { title, paragraphs } = data;
        this.renderTitle(title);
        const typeToParagraph = _.groupBy(paragraphs, 'type');
        const texts = typeToParagraph['text'].map(({ context }) => context);
        this.imgSrcs = typeToParagraph['img'].map(({ src }) => src);

        texts.forEach((text, index) => {
            this.currentElement = document.createElement('DIV');
            this.currentElement.innerHTML = text;
            this.traverse();
        });
    }
    traverse () {
        const page = this.pages[this.indexOfPage];
        if (page.isFull) {
            this.pages.push(new Page());
            this.traverseNextPage();
            return;
        }
        for (let i=0; i < page.columns.length; i ++) {
            const column = page.columns[i];
            if (!column.isFull) {
                this.updateAdditionalHeight(column.isEmpty() ? 0 : 30);
                if (column.isEnoughToAdd(this.currentAdditionalHeight)) {
                    column.elements.push(this.currentElement);
                    column.usedHeight += this.currentAdditionalHeight;
                    break;
                }
                else {
                    column.isFull = true;

                    if (i === page.columns.length - 1) {
                        page.isFull = true;
                        this.traverse();
                        return;
                    }
                }
            }
        }
    }
    traverseNextPage () {
        this.indexOfPage ++;
        this.traverse();
    }
    renderTitle (text) {
        const firstPage = this.pages[0].columns[0];
        const title = document.createElement('div');
        title.className = 'title';
        title.innerText = text;
        firstPage.elements.push(title);
        firstPage.usedHeight += title.offsetHeight + 30;
    }
    render () {
        this.pages.forEach((page, pageIndex) => {
            const divPage = document.createElement('DIV');
            divPage.className = 'page';
            page.columns.forEach(({ elements }, columnIndex) => {
                const divColumn = document.createElement('DIV');
                divColumn.className = 'column';
                elements.forEach((element, elementIndex) => {
                    element.className = `element ${element.className}`;
                    divColumn.appendChild(element);

                    // template A
                    if(columnIndex === 0 && elementIndex === 0) {
                        this.appendAnImage(divColumn);
                    }
                });

                if(columnIndex === 0 && _.isEmpty(elements)) {
                    this.appendAnImage(divColumn);
                }

                if(columnIndex === 1) {
                    this.appendAnImage(divColumn);
                }

                divPage.appendChild(divColumn);
            });
            document.body.appendChild(divPage);
            // this.generatePageBorder();
            this.generatePageFooter(pageIndex)
        });
    }
    appendAnImage (divColumn) {
        if (this.imgSrcs.length > 0) {
            const imgSrc = this.imgSrcs.shift();
            const img = document.createElement('IMG');
            img.style.height = `${imgHeight}px`
            img.src = imgSrc;
            img.className = 'element';
            divColumn.appendChild(img);
        }
    }
    generatePageFooter (pageIndex) {
        const pageFooter = document.createElement('footer');
        pageFooter.className = 'footer';
        pageFooter.innerHTML = `---  ${pageIndex + 1}  ---`;
        document.body.appendChild(pageFooter);
    }
    // generatePageBorder () {
    //     const pageBorder = document.createElement('div');
    //     pageBorder.className = 'border';
    //     document.body.appendChild(pageBorder);
    // }
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

        this.usedHeight = imgHeight; //TODO
    }
    isEnoughToAdd(additionalHeight) {
        return this.height >= this.usedHeight + additionalHeight
    }
    isEmpty() {
        return _.isEmpty(this.elements);
    }
}
