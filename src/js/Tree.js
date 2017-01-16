import React from 'react';

import TreeNode from './TreeNode';
import nodeShape from './nodeShape';

class Tree extends React.Component {
	static propTypes = {
		checked: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
		expanded: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
		onCheck: React.PropTypes.func.isRequired,
		onExpand: React.PropTypes.func.isRequired,

		name: React.PropTypes.string,
		nameAsArray: React.PropTypes.bool,
		nodes: React.PropTypes.arrayOf(
			React.PropTypes.oneOfType([
				React.PropTypes.shape(nodeShape),
				React.PropTypes.shape({
					...nodeShape,
					children: React.PropTypes.arrayOf(nodeShape),
				}),
			]),
		),
		optimisticToggle: React.PropTypes.bool,
	};

	static defaultProps = {
		checked: [],
		expanded: [],
		name: undefined,
		nameAsArray: false,
		nodes: [],
		optimisticToggle: true,
	};

	constructor(props) {
		super(props);

		this.onCheck = this.onCheck.bind(this);
		this.onExpand = this.onExpand.bind(this);
	}

	onCheck(node) {
		const { checked, onCheck } = this.props;

		onCheck(this.toggleChecked([...checked], node, node.checked));
	}

	onExpand(node) {
		const { expanded, onExpand } = this.props;

		onExpand(this.toggleNode([...expanded], node, node.expanded));
	}

	getFormattedNodes(nodes) {
		const { checked, expanded } = this.props;

		return nodes.map((node) => {
			const formatted = Object.create(node);

			formatted.checked = checked.indexOf(node.value) > -1;
			formatted.expanded = expanded.indexOf(node.value) > -1;

			if (Array.isArray(node.children) && node.children.length > 0) {
				formatted.children = this.getFormattedNodes(formatted.children);
			} else {
				formatted.children = null;
			}

			return formatted;
		});
	}

	getCheckState(node) {
		if (node.children === null) {
			return node.checked ? 1 : 0;
		}

		if (this.isEveryChildChecked(node)) {
			return 1;
		}

		if (this.isSomeChildChecked(node)) {
			return 2;
		}

		return 0;
	}

	toggleChecked(checked, node, isChecked) {
		if (node.children !== null) {
			// Percolate check status down to all children
			node.children.forEach((child) => {
				this.toggleChecked(checked, child, isChecked);
			});
		} else {
			// Set leaf to check/unchecked state
			this.toggleNode(checked, node, isChecked);
		}

		return checked;
	}

	toggleNode(list, node, toggleValue) {
		const index = list.indexOf(node.value);

		if (index > -1 && !toggleValue) {
			list.splice(index, 1);
		} else if (index === -1 && toggleValue) {
			list.push(node.value);
		}

		return list;
	}

	isEveryChildChecked(node) {
		return node.children.every((child) => {
			if (child.children !== null) {
				return this.isEveryChildChecked(child);
			}

			return child.checked;
		});
	}

	isSomeChildChecked(node) {
		return node.children.some((child) => {
			if (child.children !== null) {
				return this.isSomeChildChecked(child);
			}

			return child.checked;
		});
	}

	renderTreeNodes(nodes) {
		const treeNodes = nodes.map((node, index) => {
			const key = `${index}-${node.value}`;
			const checked = this.getCheckState(node);
			const children = this.renderChildNodes(node);

			return (
				<TreeNode
					key={key}
					checked={checked}
					expanded={node.expanded}
					optimisticToggle={this.props.optimisticToggle}
					rawChildren={node.children}
					title={node.title}
					value={node.value}
					onCheck={this.onCheck}
					onExpand={this.onExpand}
				>
					{children}
				</TreeNode>
			);
		});

		return (
			<ol>
				{treeNodes}
			</ol>
		);
	}

	renderChildNodes(node) {
		if (node.children !== null && node.expanded) {
			return this.renderTreeNodes(node.children);
		}

		return null;
	}

	renderHiddenInput() {
		if (this.props.name === undefined) {
			return null;
		}

		if (this.props.nameAsArray) {
			return this.renderArrayHiddenInput();
		}

		return this.renderJoinedHiddenInput();
	}

	renderArrayHiddenInput() {
		return this.props.checked.map((value) => {
			const name = `${this.props.name}[]`;

			return <input key={value} name={name} type="hidden" value={value} />;
		});
	}

	renderJoinedHiddenInput() {
		const checked = this.props.checked.join(',');

		return <input name={this.props.name} type="hidden" value={checked} />;
	}

	render() {
		const nodes = this.getFormattedNodes(this.props.nodes);
		const treeNodes = this.renderTreeNodes(nodes);

		return (
			<div className="react-checkbox-tree">
				{this.renderHiddenInput()}
				{treeNodes}
			</div>
		);
	}
}

export default Tree;
