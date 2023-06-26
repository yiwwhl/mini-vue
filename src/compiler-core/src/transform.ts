import { NodeTypes } from "./ast";
import { TO_DISPLAY_STRING } from "./runtimeHelpers";

export function transform(root, options = {}) {
  // 1. 创建 context

  const context = createTransformContext(root, options);

  // 2. 遍历 node
  traverseNode(root, context);

  createRootCodegen(root, context);

  root.helpers.push(...context.helpers.keys());
}

function traverseNode(node: any, context) {
  const type: NodeTypes = node.type;

  // 遍历调用所有的 nodeTransforms
  // 把 node 给到 transform
  // 用户可以对 node 做处理
  const nodeTransforms = context.nodeTransforms;
  const exitFns: any = [];
  for (let i = 0; i < nodeTransforms.length; i++) {
    const transform = nodeTransforms[i];

    const onExit = transform(node, context);
    if (onExit) {
      exitFns.push(onExit);
    }
  }

  switch (type) {
    case NodeTypes.INTERPOLATION:
      // 插值的点，在于后续生成 render 代码的时候是获取变量的值
      context.helper(TO_DISPLAY_STRING);
      break;

    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:

      traverseChildren(node, context);
      break;

    default:
      break;
  }



  let i = exitFns.length;
  // i-- 这个很巧妙
  // 使用 while 是要比 for 快 (可以使用 https://jsbench.me/ 来测试一下)
  while (i--) {
    exitFns[i]();
  }
}

function traverseChildren(parent: any, context: any) {
  // node.children
  parent.children.forEach((node) => {
    // TODO 需要设置 context 的值
    traverseNode(node, context);
  });
}

function createTransformContext(root, options): any {
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || [],
    helpers: new Map(),
    helper(name) {
      // 这里会收集调用的次数
      // 收集次数是为了给删除做处理的， （当只有 count 为0 的时候才需要真的删除掉）
      // helpers 数据会在后续生成代码的时候用到
      const count = context.helpers.get(name) || 0;
      context.helpers.set(name, count + 1);
    },
  };

  return context;
}

function createRootCodegen(root: any, context: any) {
  const { children } = root;

  
  const child = children[0];

  if (child.type === NodeTypes.ELEMENT && child.codegenNode) {
    const codegenNode = child.codegenNode;
    root.codegenNode = codegenNode;
  } else {
    root.codegenNode = child;
  }
}