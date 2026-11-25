import { AfterViewInit, Directive, ElementRef, OnDestroy, inject } from '@angular/core';

@Directive({
  selector: '[appDependencyConnections]',
})
export class DependencyConnectionsDirective implements AfterViewInit, OnDestroy {
  private readonly list = inject<ElementRef<HTMLUListElement>>(ElementRef).nativeElement;
  private readonly resizeObserver = new ResizeObserver(() => this.scheduleDraw());
  private readonly mutationObserver = new MutationObserver(() => {
    this.observeCards();
    this.scheduleDraw();
  });
  private frame = 0;

  ngAfterViewInit(): void {
    this.resizeObserver.observe(this.list);
    const parentCard = this.list.previousElementSibling;
    if (parentCard) this.resizeObserver.observe(parentCard);
    this.observeCards();
    this.mutationObserver.observe(this.list, { childList: true });
    this.scheduleDraw();
  }

  ngOnDestroy(): void {
    this.resizeObserver.disconnect();
    this.mutationObserver.disconnect();
    cancelAnimationFrame(this.frame);
  }

  private observeCards(): void {
    for (const element of this.list.querySelectorAll(':scope > .tree-node, :scope > .tree-node > .component-card')) {
      this.resizeObserver.observe(element);
    }
  }

  private scheduleDraw(): void {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => this.draw());
  }

  private draw(): void {
    const svg = this.list.querySelector<SVGSVGElement>(':scope > svg');
    const parentCard = this.list.previousElementSibling;
    if (!svg || !parentCard) return;

    const listRect = this.list.getBoundingClientRect();
    const parentRect = parentCard.getBoundingClientRect();
    const children = Array.from(this.list.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement && child.classList.contains('tree-node'),
    );
    const elements: SVGElement[] = [];

    children.forEach((child, index) => {
      const card = child.querySelector<HTMLElement>(':scope > .component-card');
      if (!card) return;
      const childRect = card.getBoundingClientRect();
      const startX = parentRect.left - listRect.left + parentRect.width * (index + 1) / (children.length + 1);
      const endX = childRect.left - listRect.left + childRect.width / 2;
      const endY = childRect.top - listRect.top;
      const middleY = endY * (index + 1) / (children.length + 1);
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${startX} 0 V ${middleY} H ${endX} V ${endY}`);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#c9c0d0');
      elements.push(path);

      const flow = child.dataset['flowTipe'];
      if (flow === 'I' || flow === 'O' || flow === 'B') {
        elements.push(this.marker(startX, 0, flow === 'I', true));
        elements.push(this.marker(endX, endY, flow !== 'I', false));
      }
    });
    svg.replaceChildren(...elements);
  }

  private marker(x: number, y: number, arrow: boolean, start: boolean): SVGElement {
    const ns = 'http://www.w3.org/2000/svg';
    if (arrow) {
      const polygon = document.createElementNS(ns, 'polygon');
      const baseY = y + (start ? 7 : -7);
      polygon.setAttribute('points', `${x},${y} ${x - 4},${baseY} ${x + 4},${baseY}`);
      polygon.setAttribute('fill', '#a99ab3');
      return polygon;
    }
    const circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('cx', String(x));
    circle.setAttribute('cy', String(y + (start ? 3 : -3)));
    circle.setAttribute('r', '3');
    circle.setAttribute('fill', '#a99ab3');
    return circle;
  }
}
