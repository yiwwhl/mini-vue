import { baseParser } from "../src/parser"
import { transform } from '../src/transform';

describe('transform', () => {
  it('happy path', () => {
    const ast = baseParser("<div>hi,{{message}}</div>")
    transform(ast)
    const nodeText = ast.children[0].children[0]
    expect(nodeText.content).toEqual("hi,")
  })
})