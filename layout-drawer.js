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
    }
    parse (data) {
        const { title, paragraphs } = data;
        this.renderTitle(title);
        const typeToParagraph = _.groupBy(paragraphs, 'type');
        const texts = typeToParagraph['text'].map(({ context }) => context);
        this.imgSrcs = typeToParagraph['img'].map(({ src }) => src);

        texts.forEach(text => {
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
        this.temp.appendChild(title);
        firstPage.elements.push(title);
        firstPage.usedHeight += this.temp.offsetHeight;
    }
    render () {
        this.pages.forEach((page, pageIndex) => {
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
            // setTimeout(() => {
                document.body.appendChild(divPage);
                this.generatePageFooter(pageIndex)
            // }, 10);
        });
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
    generatePageFooter (pageIndex) {
        const pageFooter = document.createElement('footer');
        pageFooter.className = 'footer';
        pageFooter.innerHTML = `---  ${pageIndex + 1}  ---`;
        document.body.appendChild(pageFooter);
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

        this.usedHeight = imgHeight; //TODO
    }
    isEnoughToAdd(additionalHeight) {
        return this.height >= this.usedHeight + additionalHeight;
    }
    getCountOfLinesEnoughToAdd(additionalHeight) {
        return Math.floor((this.usedHeight - additionalHeight) / 30);
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
