---
title: 矩阵Embedding 之后送入大模型
slug: Matrix-Embedding-LLM
date: 2026-11-12
category: paper
---

论文原文：[https://arxiv.org/pdf/2606.13811](https://arxiv.org/pdf/2606.13811)

Aligning Quantum Operators with Large Language Models

MIT-IBM Computing Research Lab 、IBM Quantum 2026

# 论文

## 核心创新

也是直接把酉矩阵元素输入给 LLM，让 LLM 直接生成对应的量子电路。

方法创新：

架构创新：

## 酉矩阵是怎么组织再送给 LLM 的？

不是像文本那样作为字符串直接放在 prompt，先将酉矩阵转换成 Pauli Transfer Matrix（PTM），再通过一个专门训练的编码器，把矩阵映射到 LLM 的 Embedding 空间。

## 数据集怎么来

## 输出是什么

# 问题

PTM 矩阵，扩展到多量子比特之后，这个矩阵会很大；

