/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import 'vs/css!./media/scmViewlet';
import { TPromise } from 'vs/base/common/winjs.base';
import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { Builder, Dimension } from 'vs/base/browser/builder';
import { Viewlet } from 'vs/workbench/browser/viewlet';
import { append, $ } from 'vs/base/browser/dom';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { List } from 'vs/base/browser/ui/list/listWidget';
import { IDelegate, IRenderer } from 'vs/base/browser/ui/list/list';
import { VIEWLET_ID } from 'vs/workbench/parts/scm/common/scm';
import { ISCMService, ISCMResourceGroup, ISCMResource } from 'vs/workbench/services/scm/common/scm';

interface SearchInputEvent extends Event {
	target: HTMLInputElement;
	immediate?: boolean;
}

interface ResourceGroupTemplate {
	container: HTMLElement;
}

class ResourceGroupRenderer implements IRenderer<ISCMResourceGroup, ResourceGroupTemplate> {

	static TEMPLATE_ID = 'resource group';
	get templateId(): string { return ResourceGroupRenderer.TEMPLATE_ID; }

	renderTemplate(container: HTMLElement): ResourceGroupTemplate {
		return { container };
	}

	renderElement(group: ISCMResourceGroup, index: number, template: ResourceGroupTemplate): void {
		template.container.textContent = group.label;
	}

	disposeTemplate(templateData: ResourceGroupTemplate): void {
		// noop
	}
}

interface ResourceTemplate {
	container: HTMLElement;
}

class ResourceRenderer implements IRenderer<ISCMResource, ResourceTemplate> {

	static TEMPLATE_ID = 'resource';
	get templateId(): string { return ResourceRenderer.TEMPLATE_ID; }

	renderTemplate(container: HTMLElement): ResourceTemplate {
		return { container };
	}

	renderElement(resource: ISCMResource, index: number, template: ResourceTemplate): void {
		template.container.textContent = resource.uri.fsPath;
	}

	disposeTemplate(templateData: ResourceTemplate): void {
		// noop
	}
}

class Delegate implements IDelegate<ISCMResourceGroup | ISCMResource> {

	getHeight() { return 22; }

	getTemplateId(element: ISCMResourceGroup | ISCMResource) {
		return (element as ISCMResource).uri ? ResourceRenderer.TEMPLATE_ID : ResourceGroupRenderer.TEMPLATE_ID;
	}
}

export class SCMViewlet extends Viewlet {

	private list: List<ISCMResourceGroup | ISCMResource>;
	private disposables: IDisposable[] = [];

	constructor(
		@ITelemetryService telemetryService: ITelemetryService,
		@ISCMService private scmService: ISCMService
	) {
		super(VIEWLET_ID, telemetryService);
	}

	create(parent: Builder): TPromise<void> {
		super.create(parent);
		parent.addClass('scm-viewlet');

		const root = parent.getHTMLElement();
		const list = append(root, $('.scm-status'));

		const delegate = new Delegate();

		this.list = new List(list, delegate, [
			new ResourceGroupRenderer(),
			new ResourceRenderer()
		]);


		// chain(this.list.onSelectionChange)
		// 	.map(e => e.elements[0])
		// 	.filter(e => !!e)
		// 	.on(this.openExtension, this, this.disposables);

		this.update();

		return TPromise.as(null);
	}

	private update(): void {
		const provider = this.scmService.activeProvider;
		const groups = provider.resourceGroups;
		const elements = groups.reduce<(ISCMResourceGroup | ISCMResource)[]>((result, group) => [...result, group, ...group.get()], []);

		this.list.splice(0, this.list.length, ...elements);
	}

	layout({ height }: Dimension): void {
		this.list.layout(height);
	}

	getOptimalWidth(): number {
		return 400;
	}

	dispose(): void {
		this.disposables = dispose(this.disposables);
		super.dispose();
	}
}
