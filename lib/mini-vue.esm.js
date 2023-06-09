function isEmptyObject(value) {
    return isObjectButNotArray(value) && Object.keys(value).length === 0;
}
function isNullOrUndefined(value) {
    return isNull(value) || isUndefined(value);
}
function isNull(value) {
    return value === null;
}
function isUndefined(value) {
    return value === undefined;
}
const isObjectButNotArray = (value) => {
    return isObject(value) && !isArray(value);
};
const isObject = (value) => {
    return !isNull(value) && typeof value === "object";
};
const isString = (value) => {
    return !isNull(value) && typeof value === "string";
};
const isArray = Array.isArray;
const isOn = (key) => /^on[A-Z]/.test(key);
const isFunction = (value) => {
    return !isNull(value) && typeof value === "function";
};

const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
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
        component: null,
        key: props === null || props === void 0 ? void 0 : props.key,
        shapeFlag: getShapeFlag(type)
    };
    if (isString(children)) {
        vnode.shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    if (isArray(children)) {
        vnode.shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    if (vnode.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        if (isObjectButNotArray(children)) {
            vnode.shapeFlag |= 16 /* ShapeFlags.SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function getShapeFlag(type) {
    return isString(type) ? 1 /* ShapeFlags.ELEMENT */ : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, key, props) {
    const slot = slots[key];
    if (slot) {
        if (isFunction(slot)) {
            return createVNode(Fragment, {}, slot(props));
        }
    }
    return createVNode("div", {}, slots);
}

const merge = Object.assign;
const hasChanged = (value, anotherValue) => {
    return !Object.is(value, anotherValue);
};
const hasOwn = (target, key) => {
    if (!target || !key)
        return;
    return Object.prototype.hasOwnProperty.call(target, key);
};
const capitalizeTheFirstLetter = (str) => {
    return [...str].reduce((acc, cur) => acc === "" ? acc.concat(cur.toUpperCase()) : acc.concat(cur), "");
};
/**
 * 用于支持烤肉串式命名
 */
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, c) => {
        return capitalizeTheFirstLetter(c);
    });
};

let activeEffect;
let shouldTrack;
class ReactiveEffect {
    constructor(_fn, options) {
        this.active = true;
        this.depsPool = [];
        merge(this, options);
        this.fn = _fn;
    }
    run() {
        if (!this.active) {
            return this.fn();
        }
        shouldTrack = true;
        activeEffect = this;
        const r = this.fn();
        shouldTrack = false;
        return r;
    }
    stop() {
        if (this.active) {
            if (this.onStop) {
                this.onStop();
            }
            cleanupEffect(this);
            this.active = false;
        }
    }
}
function cleanupEffect(effect) {
    effect.depsPool.forEach((deps) => {
        deps.delete(effect);
    });
    effect.depsPool.length = 0;
}
const targetMap = new Map();
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}
function track(target, key) {
    if (!isTracking())
        return;
    let keyMap = targetMap.get(target);
    if (!keyMap) {
        keyMap = new Map();
        targetMap.set(target, keyMap);
    }
    let deps = keyMap.get(key);
    if (!deps) {
        deps = new Set();
        keyMap.set(key, deps);
    }
    trackEffects(deps);
}
function trackEffects(deps) {
    if (deps.has(activeEffect))
        return;
    deps.add(activeEffect);
    activeEffect.depsPool.push(deps);
}
function trigger(target, key) {
    let keyMap = targetMap.get(target);
    let deps = keyMap.get(key);
    triggerEffects(deps);
}
function triggerEffects(deps) {
    for (const dep of deps) {
        if (dep.scheduler) {
            dep.scheduler();
        }
        else {
            dep.run();
        }
    }
}
function effect(fn, options) {
    const effect = new ReactiveEffect(fn, options);
    effect.run();
    const runner = effect.run.bind(effect);
    runner.effect = effect;
    return runner;
}

function createGetter(isReadonly = false, isShallow = false) {
    return function get(target, key) {
        if (key === "__v_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadonly;
        }
        if (key === "__v_isReadonly" /* ReactiveFlags.IS_READONLy */) {
            return isReadonly;
        }
        const r = Reflect.get(target, key);
        if (isShallow)
            return r;
        if (isObject(r)) {
            return isReadonly ? readonly(r) : reactive(r);
        }
        if (!isReadonly) {
            track(target, key);
        }
        return r;
    };
}
function createSetter() {
    return function set(target, key, value) {
        const r = Reflect.set(target, key, value);
        trigger(target, key);
        return r;
    };
}
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
const mutableHandlers = {
    get,
    set
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key) {
        console.warn(`key(${key}) set failed, because target is readonly:`, target);
        return true;
    }
};
const shallowReadonlyHandlers = merge({}, readonlyHandlers, {
    get: shallowReadonlyGet
});

function createActiveObject(raw, baseHandlers) {
    if (!isObject(raw)) {
        console.warn(`proxy target must be a object`);
        return;
    }
    return new Proxy(raw, baseHandlers);
}
function reactive(raw) {
    return createActiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    return createActiveObject(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createActiveObject(raw, shallowReadonlyHandlers);
}

class RefImpl {
    constructor(value) {
        this.__v_isRef = true;
        this._rawValue = value;
        this._value = convert(value);
        this.deps = new Set();
    }
    get value() {
        isTracking() && trackEffects(this.deps);
        return this._value;
    }
    set value(newValue) {
        if (!hasChanged(newValue, this._rawValue))
            return;
        this._rawValue = newValue;
        this._value = convert(newValue);
        triggerEffects(this.deps);
    }
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function ref(value) {
    return new RefImpl(value);
}
function isRef(mayBeRef) {
    return !!mayBeRef.__v_isRef;
}
function unRef(mayBeRef) {
    return isRef(mayBeRef) ? mayBeRef.value : mayBeRef;
}
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value);
            }
            else {
                return Reflect.set(target, key, value);
            }
        }
    });
}

/**
 * 小技巧，这里的 instance 用户是无感知的，是通过在 component 层去 bind 了第一个值。当然这个技巧也可以调整为高阶函数
 */
function emit(instance, event, ...values) {
    /**
     * 对于用户侧的实现，需要增加一些错误处理，避免滑丝
     */
    if (!isString(event))
        return console.warn("the type of event name should be string: ", event), "";
    const { props } = instance;
    const handlerName = `on${capitalizeTheFirstLetter(camelize(event))}`;
    const handler = props[handlerName];
    handler && handler.apply(null, values);
}

function initProps(instance, rawProps) {
    instance.props = rawProps !== null && rawProps !== void 0 ? rawProps : {};
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
    $props: (i) => i.props
};
const publicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        // strategies mode
        if (hasOwn(publicPropertiesMap, key)) {
            return publicPropertiesMap[key](instance);
        }
        // setupState
        const { setupState, props } = instance;
        if (hasOwn(props, key)) {
            return props[key];
        }
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
    }
};

function initSlots(instance, children) {
    if (instance.vnode.shapeFlag & 16 /* ShapeFlags.SLOT_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}
function normalizeObjectSlots(children, slots) {
    for (const key in children) {
        const value = children[key];
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}

function createComponentInstance(vnode, parent) {
    const provides = {};
    if (parent) {
        Object.setPrototypeOf(provides, parent.provides);
    }
    const componentInstance = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        provides,
        parent,
        isMounted: false,
        subTree: {},
        next: null,
        emit: () => { }
    };
    componentInstance.emit = emit.bind(null, componentInstance);
    return componentInstance;
}
function setupComponent(instance) {
    // handle props
    initProps(instance, instance.vnode.props);
    // handle slots
    initSlots(instance, instance.vnode.children);
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
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit
        });
        setCurrentInstance(null);
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
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (Component.render) {
        instance.render = Component.render;
    }
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
/**
 * 合理封装函数是非常必要的，例如后续如果我们需要知道当前是哪一个 instance，只需要在这个函数中打一个断点即可
 * 同时这个函数也起到了一个中间层的作用，也就是整个赋值操作必须通过这个函数，我们可以借助这个函数做很多事情
 */
function setCurrentInstance(instance) {
    currentInstance = instance;
}

function provide(key, value) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const { provides } = currentInstance;
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    var _a;
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;
        if (isFunction(defaultValue)) {
            defaultValue = defaultValue();
        }
        return (_a = parentProvides[key]) !== null && _a !== void 0 ? _a : defaultValue;
    }
}

function shouldUpdateComponent(oldVnode, newVnode) {
    const { props: oldProps } = oldVnode;
    const { props: newProps } = newVnode;
    for (const key in newProps) {
        if (newProps[key] !== oldProps[key]) {
            return true;
        }
    }
    return false;
}

function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainerId) {
                if (isString(rootContainerId)) {
                    rootContainerId = document.querySelector(rootContainerId);
                }
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainerId);
            }
        };
    };
}

const queue = [];
let isFlushPending = false;
function queueJobs(job) {
    if (!queue.includes(job)) {
        queue.push(job);
    }
    queueFlush();
}
function queueFlush() {
    if (isFlushPending)
        return;
    isFlushPending = true;
    nextTick(() => {
        isFlushPending = false;
        let job;
        while ((job = queue.shift())) {
            job && job();
        }
    });
}
const microtask = Promise.resolve();
function nextTick(fn) {
    return fn ? microtask.then(fn) : microtask;
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText } = options;
    function render(vnode, container) {
        patch(null, vnode, container);
    }
    function patch(oldVnode, newVnode, container, parentComponent, anchor) {
        /**
         * 由于这是一个递归的过程，所以我们需要做一个判断，让这个递归有一出口
         * 而出口就是拆箱到组件类型为 element 的时候，这时候需要去 mount 这个 element
         */
        const { type, shapeFlag } = newVnode;
        // Fragment -> only render children
        switch (type) {
            case Fragment:
                processFragment(oldVnode, newVnode, container, parentComponent);
                break;
            case Text:
                processText(oldVnode, newVnode, container);
                break;
            default:
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(oldVnode, newVnode, container, parentComponent, anchor);
                }
                if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    processComponent(oldVnode, newVnode, container, parentComponent);
                }
                break;
        }
    }
    function processText(oldVnode, newVnode, container) {
        const { children } = newVnode;
        const textNode = (newVnode.el = document.createTextNode(children));
        container.append(textNode);
    }
    function processFragment(oldVnode, newVnode, container, parentComponent) {
        mountArrayChildren(newVnode.children, container, parentComponent);
    }
    function processComponent(oldVnode, newVnode, container, parentComponent) {
        if (!oldVnode) {
            mountComponent(newVnode, container, parentComponent);
        }
        else {
            updateComponent(oldVnode, newVnode);
        }
    }
    function updateComponent(oldVnode, newVnode) {
        const instance = (newVnode.component = oldVnode.component);
        instance.next = newVnode;
        if (shouldUpdateComponent(oldVnode, newVnode)) {
            instance.update();
        }
    }
    /**
     * 对于组件的挂载来说，主要有三步
     * 1. 创建组件实例，扩展可携带元数据的能力
     * 2. 基于第一步创建的实例对象，装载诸如 props, slots 等元数据，同时处理 setup 函数和 render 函数的互动，最终生成一个渲染函数
     * 3.
     */
    function mountComponent(vnode, container, parentComponent) {
        const instance = (vnode.component = createComponentInstance(vnode, parentComponent));
        setupComponent(instance);
        setupRenderEffect(instance, container);
    }
    function mountElement(vnode, container, parentComponent, anchor) {
        const el = (vnode.el = hostCreateElement(vnode.type));
        /**
         * 对于 children 来说，有两种类型，string 或 array，需要分别处理
         * 但是对于 happy 来说，我们首先关注的是 string 的 case
         */
        const { children, shapeFlag } = vnode;
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            el.textContent = children;
        }
        if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            mountArrayChildren(vnode.children, el, parentComponent);
        }
        const { props } = vnode;
        Object.keys(props).forEach((key) => {
            hostPatchProp(el, key, null, props[key]);
        });
        // 需要在 insert 的时候指定锚点
        hostInsert(el, container, anchor);
    }
    function mountArrayChildren(children, container, parentComponent) {
        children.forEach((v) => patch(null, v, container, parentComponent));
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
        instance.update = effect(() => {
            if (!instance.isMounted) {
                const { proxy } = instance;
                const subTree = (instance.subTree = instance.render.call(proxy));
                patch(null, subTree, container, instance);
                instance.vnode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                const { proxy } = instance;
                const { next, vnode } = instance;
                if (next) {
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                const subTree = instance.render.call(proxy);
                const prevSubTree = instance.subTree;
                instance.subTree = subTree;
                patch(prevSubTree, subTree, container, instance);
            }
        }, {
            scheduler() {
                console.log("update");
                queueJobs(instance.update);
            }
        });
    }
    function updateComponentPreRender(instance, nextVNode) {
        instance.vnode = nextVNode;
        instance.next = null;
        instance.props = nextVNode.props;
    }
    /**
     * 对于 element 的处理来说，有初始化和更新两种，首先实现初始化
     */
    function processElement(oldVnode, newVnode, container, parentComponent, anchor) {
        if (!oldVnode) {
            mountElement(newVnode, container, parentComponent, anchor);
        }
        else {
            patchElement(oldVnode, newVnode, container, parentComponent);
        }
    }
    function patchElement(oldVnode, newVnode, container, parentComponent) {
        var _a, _b;
        // TODO: compare
        // props
        const oldProps = (_a = oldVnode.props) !== null && _a !== void 0 ? _a : {};
        const newProps = (_b = newVnode.props) !== null && _b !== void 0 ? _b : {};
        const el = (newVnode.el = oldVnode.el);
        patchChildren(oldVnode, newVnode, el, parentComponent);
        patchProps(el, oldProps, newProps);
    }
    function patchChildren(oldVnode, newVnode, container, parentComponent) {
        /**
         * children 的四种更新情况
         * 1. array to text
         * 2. text to text
         * 3. array to array
         * 4. text to array
         */
        const { shapeFlag: oldShapeFlag } = oldVnode;
        const { shapeFlag: newShapFlag } = newVnode;
        if (oldShapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            // array to text
            if (newShapFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
                // 1. clear old children
                unmountChildren(oldVnode.children);
                // 2. set text
                if (oldVnode.children !== newVnode.children) {
                    hostSetElementText(container, newVnode.children);
                }
            }
            if (newShapFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
                // array to array
                patchKeyedChildren(oldVnode.children, newVnode.children, container, parentComponent);
            }
        }
        if (oldShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            if (newShapFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
                if (oldVnode.children !== newVnode.children) {
                    hostSetElementText(container, newVnode.children);
                }
            }
            if (newShapFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
                hostSetElementText(container, "");
                mountArrayChildren(newVnode.children, container, parentComponent);
            }
        }
    }
    function isVNodeTypeTheSame(oldChild, newChild) {
        /**
         *  决定两个虚拟节点是否一样有两种方式
         *  1. type：虚拟节点类型
         *  2. key
         */
        return oldChild.type === newChild.type && oldChild.key === newChild.key;
    }
    function patchKeyedChildren(oldChildren, newChildren, container, parentComponent) {
        // init pointer
        let i = 0;
        let e1 = oldChildren.length - 1;
        let e2 = newChildren.length - 1;
        // 左侧
        while (i <= e1 && i <= e2) {
            const oldChild = oldChildren[i];
            const newChild = newChildren[i];
            /**
             * 这里再简单的解释一下，isVNodeTypeTheSame 是为了判断新旧虚拟节点是否同一个类型，这里判断的标准是
             * type 相等或者 key 相等
             * 如果是同一个类型，那么说明变化的只是 props 或者 children，只需要调用 patch 函数去 patchProps 和 patchChildren
             * 如果不是同一个类型，对左侧的查找来说，i 指针就会指向范围缩小后的起点
             */
            if (isVNodeTypeTheSame(oldChild, newChild)) {
                patch(oldChild, newChild, container, parentComponent);
            }
            else {
                break;
            }
            i++;
        }
        // 右侧
        while (i <= e1 && i <= e2) {
            const oldChild = oldChildren[e1];
            const newChild = newChildren[e2];
            if (isVNodeTypeTheSame(oldChild, newChild)) {
                patch(oldChild, newChild, container, parentComponent);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        console.log("-----------双端对比指针结果----------");
        console.log("开始的值：", oldChildren, oldChildren.map(({ children }) => children).join(","));
        console.log("结束的值：", newChildren, newChildren.map(({ children }) => children).join(","));
        console.log("i", i);
        console.log("e1", e1);
        console.log("e2", e2);
        // 3. 左侧对比情况下：新的比老的多，需要创建新的节点
        if (i > e1) {
            if (i <= e2) {
                const nextIndex = e2 + 1;
                const anchor = nextIndex < newChildren.length ? newChildren[nextIndex].el : null;
                while (i <= e2) {
                    // happy path
                    patch(null, newChildren[i], container, parentComponent, anchor);
                    i++;
                }
            }
        }
        // 4. 左侧对比情况下：老的比新的多，删除老的
        if (i > e2) {
            while (i <= e1) {
                hostRemove(oldChildren[i].el);
                i++;
            }
        }
        /**
         * 总结：上述代码是针对【有序部分】的几种处理，分别是
         * 1，创建：
         * 	从左到右，新的比老的长，比如 AB -> ABC
         * 	从右到左，新的比老的长，比如 BC -> ABC
         * 2. 删除：
         * 	从左到右，老的比新的长，比如 ABC -> AB
         *  从右到左，老的比新的长，比如 ABC -> BC
         */
        /**
         * 那么还有一些情况是乱序的，分别是下面三种
         * 1. 创建新的（在老的里面不存在，在新的里面存在）
         * 2. 删除老的（在老的里面存在， 在新的里面不存在）
         * 3. 移动（节点同时存在于新的和老的里面，但是位置变了）
         *
         * 而对于乱序来说，比如 ab(cd)fg 和 ab(ec)fg，我们会锁定对比算法到中间的 cd 和 ec 上
         * 那么这个时候，如果希望实现第二种情况，也就是将老的删除，我们需要遍历老的节点，看看是否在新的节点中，
         * 伪代码可以认为是 [c,d].forEach((i) => if(![e,c].includes(i)) { hostRemove(i.el)})
         *
         * 如果这个 list 刚好被 key 标识过，那么查找算法的复杂度会下降
         * 找不到就删除，找到了就调用 patch 继续对比 props 和 children
         */
        // 中间对比
        /**
         * 对于移动节点来说，我们需要尽可能保证被移动的节点数量更少，这是因为整个 diff 算法在框架中使用非常频繁，
         * 对性能要求极高
         * 而保证移动节点数量少的关键就是寻找到【最长递增子序列】
         * 比如，对于 cde 和 ecd 来说，cd 是相对稳定的序列，需要变的是 e 这个节点的位置
         */
        let oldStart = i; // 老节点的开始
        let newStart = i; // 新节点的开始
        let shouldMove = false;
        let currentMaxiumIndex = 0;
        // 新节点的映射表建立
        /**
         * 延伸：这也引出了一个经典的问题，也就是为什么不推荐用 index 作 key
         * 如果用 index 作 key，而我们判断两个节点是否是同一个节点的依据中，也就是 isVNodeTypeTheSame 中用到了这个 key
         * 1.如果形如 ABC -> BCD，但又比较复杂导致 A B C 的 type 各不相同时，无法判断出 ABC 中 index 为 1 的 B 和 BCD 中 index 为 0 的 B 是同一个
         * 则会导致无法复用 dom
         * 2.存在数据错位的风险，比如 ABC -> DABC，如果刚好 A 和 D 的 type 相同，会认为 A 和 D 是可复用的，因为他们的 key 都是 0
         * 那么会导致 A 的数据残留在 D 这个组件中，带来预期外的问题
         */
        // 记录 patch 过的节点
        const toBePatched = e2 - newStart + 1;
        let patched = 0;
        const KeyToNewIndexMap = new Map();
        // 这里创建映射关系是为了寻找最长递增子序列，而给一个定长的数组，是为了保证更高的性能
        const newIndexToOldIndexMap = new Array(toBePatched);
        for (let i = 0; i < toBePatched; i++) {
            newIndexToOldIndexMap[i] = 0;
        }
        for (let i = newStart; i <= e2; i++) {
            const newChild = newChildren[i];
            KeyToNewIndexMap.set(newChild.key, i);
        }
        console.log("如果有 key 时创建的一个 keyToNewIndex 映射表：", KeyToNewIndexMap);
        for (let i = oldStart; i <= e1; i++) {
            const oldChild = oldChildren[i];
            let newIndex; // 这个 newIndex 将是最终查找 anchor 的关键，也是新旧节点如果发生位置变化后的一个插入依据
            if (patched >= toBePatched) {
                hostRemove(oldChild.el);
                continue;
            }
            if (!isNullOrUndefined(oldChild.key)) {
                newIndex = KeyToNewIndexMap.get(oldChild.key);
            }
            else {
                for (let j = newStart; j <= e2; j++) {
                    const newChild = newChildren[j];
                    if (isVNodeTypeTheSame(oldChild, newChild)) {
                        newIndex = j;
                        break;
                    }
                }
            }
            if (isNullOrUndefined(newIndex)) {
                hostRemove(oldChild.el);
            }
            else {
                /**
                 * 因为移动的逻辑是基于存在的，必须存在才能够移动，所以在这可以拿到老节点中存在的节点索引
                 */
                if (newIndex >= currentMaxiumIndex) {
                    currentMaxiumIndex = newIndex;
                }
                else {
                    shouldMove = true;
                }
                // 注意这里的 i 可能为 0，代表他在老节点中是第 0 个，但是 0 对于这个映射关系有重要的意义
                // 如果为 0，我们最终会认为他不存在于新的节点中，因为初始化的时候也用的 0，所以在这用 i+1 避免这个问题
                newIndexToOldIndexMap[newIndex - newStart] = i + 1;
                patch(oldChild, newChildren[newIndex], container, parentComponent);
                patched++;
            }
        }
        console.log("寻找最长递增子序列时的映射关系表：", newIndexToOldIndexMap);
        // 求出最长递增子序列
        const longestIncreasingSubsequence = shouldMove
            ? getLongestIncreasingSubsequence(newIndexToOldIndexMap)
            : [];
        console.log("最长递增子序列：", longestIncreasingSubsequence);
        let j = longestIncreasingSubsequence.length - 1;
        for (let i = toBePatched - 1; i >= 0; i--) {
            const nextIndex = i + newStart;
            const nextChild = newChildren[nextIndex];
            const anchor = nextIndex + 1 < newChildren.length
                ? newChildren[nextIndex + 1].el
                : null;
            /**
             * 之前其实也提到了 i+1 避免为 0 的问题，这里的 0 其实就是一个标识，标识他在老的节点中不存在，需要创建
             * 这是因为当我们初始化映射表的时候，会将差异节点的旧表节点值初始化为 0，并在旧表中找到对应节点后标识索引 + 1
             */
            if (newIndexToOldIndexMap[i] === 0) {
                patch(null, nextChild, container, parentComponent, anchor);
            }
            if (shouldMove) {
                if (j < 0 || i !== longestIncreasingSubsequence[j]) {
                    hostInsert(nextChild.el, container, anchor);
                }
                else {
                    j--;
                }
            }
        }
        console.log("----------------------------------");
    }
    function getLongestIncreasingSubsequence(nums) {
        if (nums.length == 0) {
            return [];
        }
        let dp = new Array(nums.length).fill(1);
        let prev = new Array(nums.length).fill(-1);
        let maxLen = 1;
        let maxIndex = 0;
        for (let i = 1; i < nums.length; i++) {
            for (let j = 0; j < i; j++) {
                if (nums[i] > nums[j] && dp[j] + 1 > dp[i]) {
                    dp[i] = dp[j] + 1;
                    prev[i] = j;
                }
            }
            if (dp[i] > maxLen) {
                maxLen = dp[i];
                maxIndex = i;
            }
        }
        let longestSubseqIndexes = [];
        for (let i = maxIndex; i >= 0; i = prev[i]) {
            longestSubseqIndexes.unshift(i);
        }
        return longestSubseqIndexes;
    }
    function unmountChildren(children) {
        console.log(children);
        children.forEach((v) => {
            const el = v.el;
            // remove
            hostRemove(el);
        });
    }
    function patchProps(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            for (const key in newProps) {
                const prevProp = oldProps[key];
                const nextProp = newProps[key];
                if (prevProp !== nextProp) {
                    hostPatchProp(el, key, prevProp, nextProp);
                }
            }
            if (isEmptyObject(oldProps)) {
                for (const oldKey in oldProps) {
                    if (!(oldKey in newProps)) {
                        hostPatchProp(el, oldKey, oldProps[oldKey], null);
                    }
                }
            }
        }
    }
    return {
        createApp: createAppAPI(render)
    };
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, prevValue, nextValue) {
    if (isOn(key)) {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, nextValue);
    }
    else {
        if (isNullOrUndefined(nextValue)) {
            // should remove prop
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextValue);
        }
    }
}
function insert(child, container, anchor) {
    /**
     * 这个 api 比较有意思，如果 anchor 未指定，则默认行为是 append，如果指定，则会将节点添加到 anchor 之前
     */
    container.insertBefore(child, anchor);
}
function remove(el) {
    const parent = el.parentNode;
    if (parent) {
        parent.removeChild(el);
    }
}
function setElementText(container, text) {
    container.textContent = text;
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText
});
function createApp(rootComponent) {
    return renderer.createApp(rootComponent);
}

export { createApp, createRenderer, createTextVNode, getCurrentInstance, h, inject, nextTick, provide, proxyRefs, ref, renderSlots };
