'use strict';

function isNull(value) {
    return value === null;
}
const isObject = (value) => {
    return !isNull(value) && typeof value === "object";
};
const isString = (value) => {
    return !isNull(value) && typeof value === "string";
};
const isArray = Array.isArray;
const isOn = (key) => /^on[A-Z]/.test(key);

const publicPropertiesMap = {
    $el: (i) => i.vnode.el
};
const publicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        // strategies mode
        if (key in publicPropertiesMap) {
            return publicPropertiesMap[key](instance);
        }
        // setupState
        const { setupState } = instance;
        if (key in setupState) {
            return setupState[key];
        }
    }
};

function createComponentInstance(vnode) {
    const componentInstance = {
        vnode,
        type: vnode.type,
        setupState: {}
    };
    return componentInstance;
}
function setupComponent(instance) {
    // TODO: handle props
    // initProps()
    // TODO: handle slots
    // initSlots()
    /**
     * 初始化一个有状态的组件
     * 扫盲：
     * 1.什么是有状态的组件
     *  有状态的组件，也叫做类组件或智能组件，拥有自己的状态（state）并管理它。
     *  这种类型的组件可以有生命周期方法，可以进行网络请求，并且可以处理用户输入或者其他事件。
     *  有状态的组件通常用于处理应用程序的逻辑和功能。
     * 2.什么是无状态的组件
     *  无状态的组件，也叫做函数组件或呈现组件，不包含和管理自己的状态。
     *  它们只接受输入（props）并渲染 UI，不涉及状态管理或生命周期方法。
     *  这使得无状态的组件更简单，更易于理解和测试。无状态的组件通常用于渲染 UI 和布局。
     */
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    // 你可以认为这里的 Component 命名，是为了和 defineComponent 产生对应
    const Component = instance.type;
    instance.proxy = new Proxy({
        _: instance
    }, publicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        /**
         * setup 可能会返回 function，也可能会返回 object
         * 如果是 function 的话，会作为该 Component 的 render 函数
         * 如果是 object 的话，会将该 object 合并到组件的上下文中
         */
        const setupResult = setup();
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    /**
     * 这个其实也是属于任务拆分的一部分，优先实现 happy path，或者说 core path
     * 将边缘 case 留作 TODO
     */
    // TODO: implement function later
    if (isObject(setupResult)) {
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (Component.render) {
        instance.render = Component.render;
    }
}

function render(vnode, container) {
    patch(vnode, container);
}
function patch(vnode, container) {
    /**
     * 由于这是一个递归的过程，所以我们需要做一个判断，让这个递归有一出口
     * 而出口就是拆箱到组件类型为 element 的时候，这时候需要去 mount 这个 element
     */
    const { shapeFlags } = vnode;
    if (shapeFlags & 1 /* ShapeFlags.ELEMENT */) {
        processElement(vnode, container);
    }
    if (shapeFlags & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        processComponent(vnode, container);
    }
}
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
/**
 * 对于组件的挂载来说，主要有三步
 * 1. 创建组件实例，扩展可携带元数据的能力
 * 2. 基于第一步创建的实例对象，装载诸如 props, slots 等元数据，同时处理 setup 函数和 render 函数的互动，最终生成一个渲染函数
 * 3.
 */
function mountComponent(vnode, container) {
    const instance = createComponentInstance(vnode);
    setupComponent(instance);
    setupRenderEffect(instance, container);
}
function mountElement(vnode, container) {
    const el = (vnode.el = document.createElement(vnode.type));
    /**
     * 对于 children 来说，有两种类型，string 或 array，需要分别处理
     * 但是对于 happy 来说，我们首先关注的是 string 的 case
     */
    const { children, shapeFlags } = vnode;
    if (shapeFlags & 4 /* ShapeFlags.TEXT_CHILDREN */) {
        el.textContent = children;
    }
    if (shapeFlags & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
        mountArrayChildren(vnode, el);
    }
    const { props } = vnode;
    Object.keys(props).forEach((key) => {
        console.log(key);
        if (isOn(key)) {
            const event = key.slice(2).toLowerCase();
            el.addEventListener(event, props[key]);
        }
        else {
            el.setAttribute(key, props[key]);
        }
    });
    container.append(el);
}
function mountArrayChildren(vnode, container) {
    vnode.children.forEach((v) => patch(v, container));
}
/**
 * 该操作主要在获取 render 的返回值，而 render 在上一步的 setup 中已经确认了一定有值
 * 所以这一阶段的 happy path 只需要简单调用 instance 上的 render
 *
 * 所以其实用户侧的实现更像是一个箱子，用户将需要渲染的内容以装箱的形式整体提供给 vue
 * 而 vue 在内部通过拆箱的方式去将整体模块拆分至 element，最后再进行 element 的挂载
 */
function setupRenderEffect(instance, container) {
    // 取名 subTree，因为通过 h 函数返回的是一棵 vnode 树
    const { proxy } = instance;
    const subTree = instance.render.call(proxy);
    patch(subTree, container);
    instance.vnode.el = subTree.el;
}
/**
 * 对于 element 的处理来说，有初始化和更新两种，首先实现初始化
 */
function processElement(vnode, container) {
    // TODO: update
    mountElement(vnode, container);
}

function createVNode(type, props, children) {
    /**
     * 需要特别说明的是，初始化传入 App.js 的时候这里的 type
     * 并不是传统意义上理解的 ElementType，而是一个组件的用户侧实现，你可以认为
     * 初始化的时候这个 type 就是 tsx 中通过 defineComponent 定义的一个对象
     *
     * 当然，实际上，这个 type 在使用的时候是可能为 ElementType 的
     * 就比如 h("div", undefined, "case")
     */
    const vnode = {
        type,
        props,
        children,
        el: null,
        shapeFlags: getShapeFlag(type)
    };
    if (isString(children)) {
        vnode.shapeFlags |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    if (isArray(children)) {
        vnode.shapeFlags |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    return vnode;
}
function getShapeFlag(type) {
    return isString(type) ? 1 /* ShapeFlags.ELEMENT */ : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}

function createApp(rootComponent) {
    return {
        mount(rootContainerId) {
            const rootContainer = document.querySelector(rootContainerId);
            const vnode = createVNode(rootComponent);
            render(vnode, rootContainer);
        }
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

exports.createApp = createApp;
exports.h = h;
