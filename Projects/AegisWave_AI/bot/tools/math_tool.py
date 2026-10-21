"""
AegisWave AI - Math Tool
Safe mathematical evaluation engine preventing arbitrary code injection.
"""

import ast
import operator
import math

# Safe operator mapping
OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}

SAFE_FUNCTIONS = {
    "sqrt": math.sqrt,
    "sin": math.sin,
    "cos": math.cos,
    "tan": math.tan,
    "log": math.log,
    "exp": math.exp,
    "abs": abs,
    "round": round,
}

def _eval_node(node):
    if isinstance(node, ast.Constant):
        if isinstance(node.value, (int, float)):
            return node.value
        raise ValueError("Only numbers are allowed.")
    elif isinstance(node, ast.BinOp):
        op_type = type(node.op)
        if op_type not in OPERATORS:
            raise ValueError(f"Operator {op_type.__name__} not supported.")
        return OPERATORS[op_type](_eval_node(node.left), _eval_node(node.right))
    elif isinstance(node, ast.UnaryOp):
        op_type = type(node.op)
        if op_type not in OPERATORS:
            raise ValueError(f"Unary operator {op_type.__name__} not supported.")
        return OPERATORS[op_type](_eval_node(node.operand))
    elif isinstance(node, ast.Call):
        if isinstance(node.func, ast.Name) and node.func.id in SAFE_FUNCTIONS:
            args = [_eval_node(arg) for arg in node.args]
            return SAFE_FUNCTIONS[node.func.id](*args)
        raise ValueError("Function call not allowed.")
    else:
        raise ValueError(f"Disallowed expression node: {type(node).__name__}")

import re

def calculate(expression: str) -> str:
    """Safely calculates mathematical expressions (e.g., '(15000 * 1.08**5)', '15% of 200')."""
    try:
        expr_clean = expression.strip().replace("^", "**")
        
        # Support percentage syntax e.g. "15% of 200" or "15% * 200"
        pct_match = re.search(r"([0-9\.]+)\s*%\s*(?:of|\*)\s*([0-9\.]+)", expr_clean, re.IGNORECASE)
        if pct_match:
            pct_val = float(pct_match.group(1))
            target_val = float(pct_match.group(2))
            expr_clean = f"({pct_val} / 100.0) * {target_val}"
        
        parsed = ast.parse(expr_clean, mode="eval")
        result = _eval_node(parsed.body)

        if isinstance(result, float):
            result = round(result, 10)
            if result.is_integer():
                result = int(result)

        return str(result)
    except ZeroDivisionError:
        return "Calculation Error: Division by zero"
    except Exception as e:
        return f"Calculation Error: {e}"
