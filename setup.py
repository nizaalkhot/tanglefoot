from setuptools import setup, find_packages

setup(
    name="tanglefoot",
    version="0.1.0",
    description="Tanglefoot: Standard Chaos Engineering & Adversarial Agent Evaluation SDK",
    author="Tanglefoot Dev Team",
    packages=find_packages(),
    python_requires=">=3.8",
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
)
