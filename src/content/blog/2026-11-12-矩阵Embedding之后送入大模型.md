---
title: Aligning Quantum Operators with Large Language Models
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

## 酉矩阵是怎么组织再送给 LLM 的？

不是像文本那样作为字符串直接放在 prompt，先将酉矩阵转换成 Pauli Transfer Matrix（PTM），再通过一个专门训练的编码器，把矩阵映射到 LLM 的 Embedding 空间。

矩阵元素不是通过文本查表得到 Embedding 向量，而是自己设计了编码器，生成的向量。

## 输入信息

矩阵元素：PTM Pauil Transfer Matrix；

上下文：当前已经预测的门；（利用大模型的反馈机制）；

任务指令：用指定门集之类的。





## 数据集怎么来

随机生成量子门序列(是在特定离散门集下生成的酉矩阵，不是真正的随机酉矩阵)，正向计算对应的酉矩阵；反过来训练 LLM 从矩阵恢复量子门；





## 输出是什么

# 问题

PTM 矩阵，扩展到多量子比特之后，这个矩阵会很大；

对真正 Haar 随机酉矩阵的泛化仍然有限；
